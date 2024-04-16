// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Metadata } from "../core/libraries/Metadata.sol";

import { TopupCredit } from "maci-contracts/contracts/TopupCredit.sol";
import { IMACIFactory } from "../strategies/qv-maci/interfaces/IMACIFactory.sol";
import { MACI } from "maci-contracts/contracts/MACI.sol";

import { IAllo } from "../core/interfaces/IAllo.sol";
import { IAnchor } from "../core/interfaces/IAnchor.sol";
import { RegistryIndexer } from "./RegistryIndexer.sol";
import { IRegistry } from "../core/interfaces/IRegistry.sol";
import { Clone } from "../core/libraries/Clone.sol";

contract QVMaciRegistry is RegistryIndexer {
    // Allo contract interface
    IAllo public Allo;
    // Anchor contract interface
    IAnchor public Anchor;

    // The clonable strategy to use for the pools
    address internal strategy_implementation;

    IMACIFactory _maciFactory;
    // Nonce used to generate the 'anchor' address
    uint256 deployNonce;

    constructor(address _registry, address _allo, address factory) RegistryIndexer(_registry) {
        Allo = IAllo(_allo);
        _maciFactory = IMACIFactory(factory);
    }

    uint256 public _nonce; // Nonce used to generate the 'anchor' address

    mapping(bytes32 => address) public profiles;

    mapping(uint256 => bytes32) public poolIdToProfileId;

    struct PollContracts {
        address poll;
        address messageProcessor;
        address tally;
        address subsidy;
    }

    struct InitializeParamsMACI {
        InitializeParams initializeParams;
        MACI maci;
        MACI.PollContracts pollContracts;
        address indexer;
    }
    /// ====================================
    /// ==== External/Public Functions =====
    /// ====================================

    /// @dev Creates a new 'Profile' and returns the 'profileId' of the new profile
    ///
    /// Note: The 'name' and 'nonce' are used to generate the 'anchor' address
    ///
    /// Requirements: None, anyone can create a new profile
    ///
    /// @param _name The name to use to generate the 'anchor' address
    /// @param _metadata The 'Metadata' to use to generate the 'anchor' address
    /// @return profileId The 'profileId' of the new profile
    function createProfile(
        string memory _name,
        Metadata memory _metadata,
        address[] memory _members
    ) external returns (bytes32 profileId) {
        profileId = Registry.createProfile(++_nonce, _name, _metadata, address(this), _members);

        profiles[profileId] = Registry.getProfileById(profileId).anchor;

        ProfileRegistration(profileId, _name, _metadata.pointer, _members);
    }

    function createQVMaciPool(
        bytes32 _profileId,
        InitializeParams memory initializeParams,
        address _token,
        uint256 _amount,
        Metadata memory _metadata,
        address[] memory _managers
    ) external {
        if (!Registry.isOwnerOrMemberOfProfile(_profileId, msg.sender)) {
            revert("You are not the owner of this profile");
        }

        if (_amount > 0) {
            IERC20(_token).transferFrom(msg.sender, address(this), _amount);
            IERC20(_token).approve(address(Allo), _amount);
        }

        address strategy = Clone.createClone(strategy_implementation, deployNonce++);
        uint256 pollDuration = initializeParams.allocationEndTime - block.timestamp;

        (MACI _maci, MACI.PollContracts memory _pollContracts) = _maciFactory.deployMaci(
            strategy,
            strategy,
            address(new TopupCredit()),
            pollDuration,
            initializeParams.coordinator,
            initializeParams.coordinatorPubKey,
            strategy
        );

        bytes memory _initStrategyData = abi.encode(
            InitializeParamsMACI({
                initializeParams: initializeParams,
                maci: _maci,
                pollContracts: _pollContracts,
                indexer: address(this)
            })
        );

        uint256 poolID = Allo.createPoolWithCustomStrategy(
            _profileId,
            strategy,
            _initStrategyData,
            _token,
            _amount,
            _metadata,
            _managers
        );

        poolIdToProfileId[poolID] = _profileId;

        PoolRegistration(initializeParams, poolID, strategy, _profileId, _metadata.pointer);
    }

    function updatePoolMetadata(uint256 _poolId, Metadata memory _metadata) external {
        bytes32 _profileId = poolIdToProfileId[_poolId];

        if (!Registry.isOwnerOrMemberOfProfile(_profileId, msg.sender)) {
            revert("You are not the owner of this profile");
        }

        Allo.updatePoolMetadata(_poolId, _metadata);
    }

    function registerRecipient(uint256 _poolId, Metadata memory _metadata) external {
        bytes memory _data = abi.encode(msg.sender, address(0), _metadata);

        Allo.registerRecipient(_poolId, _data);
    }

    function callWithAnchor(bytes32 _profileId, address _target, uint256 _value, bytes memory _data) external {
        if (!Registry.isOwnerOrMemberOfProfile(_profileId, msg.sender)) {
            revert("You are not the owner of this profile");
        }

        address anchor = Registry.getProfileById(_profileId).anchor;

        IAnchor(anchor).execute(_target, _value, _data);
    }

    /// ONLY A POOL STRATEGY CAN CALL THESE FUNCTIONS
    function RegisterProfile(address profileID, uint256 poolID, string memory metadata) external {
        _checkCallerIsPoolStrategy(poolID);

        RegisterProfileInPool(profileID, poolID, metadata);
    }

    function addMaciContracts(
        uint256 poolID,
        address maci,
        address pollID,
        address tallyID,
        address messageProcessorID,
        address subsidyID
    ) external {
        _checkCallerIsPoolStrategy(poolID);

        addPoolMaciContracts(poolID, maci, pollID, tallyID, messageProcessorID, subsidyID);
    }

    function InsertReviews(
        uint256 poolID,
        address reviewedBy,
        uint8[] memory status,
        address[] memory recipientIDs
    ) external {
        _checkCallerIsPoolStrategy(poolID);

        InsertReviewsToPool(poolID, reviewedBy, status, recipientIDs);
    }

    function InsertAllocation(uint256 poolID, uint256 voteAmount, address recipientID) external {
        _checkCallerIsPoolStrategy(poolID);

        InsertAllocationToPool(poolID, voteAmount, recipientID);
    }

    function InsertDistributions(
        uint256 poolID,
        uint256[] memory distributionAmount,
        address[] memory recipientIDs
    ) external {
        _checkCallerIsPoolStrategy(poolID);

        InsertDistributionsToPool(poolID, distributionAmount, recipientIDs);
    }

    function _checkCallerIsPoolStrategy(uint256 _poolId) internal view {
        address strategy = address(Allo.getPool(_poolId).strategy);
        if (strategy != msg.sender) {
            revert("You are not the owner of this poolll");
        }
    }

    function getProfileData(bytes32 _profileId) external view returns (IRegistry.Profile memory profile) {
        profile = Registry.getProfileById(_profileId);
    }

    function setPoolStrategyImplementation(address _strategy_implementation) external {
        strategy_implementation = _strategy_implementation;
    }

    function getTime() external view returns (uint256) {
        return block.timestamp;
    }
}
