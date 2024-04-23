// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Metadata } from "../core/libraries/Metadata.sol";

import { IAllo } from "../core/interfaces/IAllo.sol";
import { IRegistry } from "../core/interfaces/IRegistry.sol";
import { IAnchor } from "../core/interfaces/IAnchor.sol";
import { IRegistry } from "../core/interfaces/IRegistry.sol";
import { Clone } from "../core/libraries/Clone.sol";
import { MACI } from "maci-contracts/contracts/MACI.sol";
import { DomainObjs } from "maci-contracts/contracts/utilities/DomainObjs.sol";
// TODO TopupCredit is going to be the strategy itself or a clonable proxy to save contract size
import { TopupCredit } from "maci-contracts/contracts/TopupCredit.sol";

contract CreateStrategy {
    // Allo contract interface
    IAllo public Allo;
    // Anchor contract interface
    IAnchor public Anchor;
    // Registry contract interface
    IRegistry public Registry;

    address _maciFactory;

    // The clonable strategy to use for the pools
    address internal strategy_implementation;

    bytes32 public _profileId;

    // Nonce used to generate the 'anchor' address
    uint256 deployNonce;

    address[] public _managers;

    uint256 public poolID;

    Metadata public _metadata = Metadata(1, "test");

    address[] public strategies;

    mapping(address => MaciParams) public strategyToMaciParams;

    constructor(address _allo, address _registry, address _strategy_implementation, address factory) {
        Allo = IAllo(_allo);
        Registry = IRegistry(_registry);
        _profileId = Registry.createProfile(1, "test", _metadata, address(this), _managers);
        strategy_implementation = _strategy_implementation;
        _maciFactory = factory;
    }

    /// @notice The parameters used to initialize the strategy
    struct InitializeParams {
        // slot 0
        bool registryGating;
        bool metadataRequired;
        // slot 1
        uint256 reviewThreshold;
        // slot 2
        uint64 registrationStartTime;
        uint64 registrationEndTime;
        uint64 allocationStartTime;
        uint64 allocationEndTime;
        // slot 3
        uint256 maxVoiceCreditsPerAllocator;
    }

    struct MaciParams {
        address coordinator;
        DomainObjs.PubKey coordinatorPubKey;
        address maciFactory;
    }

    struct InitializeParamsMACI {
        InitializeParams initializeParams;
        MaciParams maciParams;
    }

    struct PollContracts {
        address poll;
        address messageProcessor;
        address tally;
        address subsidy;
    }

    function createQVMaciPool(
        InitializeParams memory initializeParams,
        address coordinator,
        MACI.PubKey memory coordinatorPubKey
    ) external {
        address strategy = Clone.createClone(strategy_implementation, deployNonce++);

        MaciParams memory _maciParams = MaciParams({
            coordinator: coordinator,
            coordinatorPubKey: coordinatorPubKey,
            maciFactory: _maciFactory
        });

        bytes memory _initStrategyData = abi.encode(
            InitializeParamsMACI({ initializeParams: initializeParams, maciParams: _maciParams })
        );

        poolID = Allo.createPoolWithCustomStrategy(
            _profileId,
            strategy,
            _initStrategyData,
            0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            0,
            _metadata,
            _managers
        );

        strategies.push(strategy);

        strategyToMaciParams[strategy] = _maciParams;
    }

    function getTime() external view returns (uint256) {
        return block.timestamp;
    }
}
