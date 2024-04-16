// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

// Interfaces

import { IRegistry } from "../../core/interfaces/IRegistry.sol";

import { IAllo } from "../../core/interfaces/IAllo.sol";

// Internal Libraries
import { Metadata } from "../../core/libraries/Metadata.sol";
// Core Contracts
import { BaseStrategy } from "../BaseStrategy.sol";

// External Libraries
import { Multicall } from "@openzeppelin/contracts/utils/Multicall.sol";

import { IRegistryIndexer } from "./interfaces/IRegistryIndexer.sol";

import { Events_Errors } from "./libraries/Events_Errors.sol";

// MACI Contracts & Libraries
import { CommonUtilities } from "maci-contracts/contracts/utilities/CommonUtilities.sol";

import { DomainObjs } from "maci-contracts/contracts/utilities/DomainObjs.sol";

import { Params } from "maci-contracts/contracts/utilities/Params.sol";

import { TopupCredit } from "maci-contracts/contracts/TopupCredit.sol";

// import {IMACIFactory} from "./interfaces/IMACIFactory.sol";

import { Tally } from "maci-contracts/contracts/Tally.sol";

import { MACI } from "maci-contracts/contracts/MACI.sol";

import { Poll } from "maci-contracts/contracts/Poll.sol";

import { MACICommon } from "./libraries/MACICommon.sol";

// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⢿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⡟⠘⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⣀⣴⣾⣿⣿⣿⣿⣾⠻⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⡿⠀⠀⠸⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⠀⠀⠀⢀⣠⣴⣴⣶⣶⣶⣦⣦⣀⡀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⡿⠃⠀⠙⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⠁⠀⠀⠀⢻⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⡀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⠀⠘⣿⣿⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⠃⠀⠀⠀⠀⠈⢿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⣰⣿⣿⣿⡿⠋⠁⠀⠀⠈⠘⠹⣿⣿⣿⣿⣆⠀⠀⠀
// ⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⢰⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⡀⠀⠀
// ⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣟⠀⡀⢀⠀⡀⢀⠀⡀⢈⢿⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⡇⠀⠀
// ⠀⠀⣠⣿⣿⣿⣿⣿⣿⡿⠋⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⡿⢿⠿⠿⠿⠿⠿⠿⠿⠿⠿⢿⣿⣿⣿⣷⡀⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠸⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⠂⠀⠀
// ⠀⠀⠙⠛⠿⠻⠻⠛⠉⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⣿⣧⠀⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⢻⣿⣿⣿⣷⣀⢀⠀⠀⠀⡀⣰⣾⣿⣿⣿⠏⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣧⠀⠀⢸⣿⣿⣿⣗⠀⠀⠀⢸⣿⣿⣿⡯⠀⠀⠀⠀⠹⢿⣿⣿⣿⣿⣾⣾⣷⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠙⠋⠛⠙⠋⠛⠙⠋⠛⠙⠋⠃⠀⠀⠀⠀⠀⠀⠀⠀⠠⠿⠻⠟⠿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⠟⠿⠟⠿⠆⠀⠸⠿⠿⠟⠯⠀⠀⠀⠸⠿⠿⠿⠏⠀⠀⠀⠀⠀⠈⠉⠻⠻⡿⣿⢿⡿⡿⠿⠛⠁⠀⠀⠀⠀⠀⠀
//                    allo.gitcoin.co

contract QVMaciStrategy is BaseStrategy, MACICommon, Multicall, DomainObjs, Params, CommonUtilities, Events_Errors {
    /// @notice Emitted when a recipient is registered
    /// @param recipientId ID of the recipient
    /// @param applicationId ID of the recipient"s application
    /// @param status The status of the recipient
    /// @param sender The sender of the transaction
    event RecipientStatusUpdated(address indexed recipientId, uint256 applicationId, Status status, address sender);

    /// @notice Emitted when a recipient is reviewed
    /// @param recipientId ID of the recipient
    /// @param applicationId ID of the recipient"s application
    /// @param status The status of the recipient
    /// @param sender The sender of the transaction
    event Reviewed(address indexed recipientId, uint256 applicationId, Status status, address sender);

    /// @notice Emitted when a recipient updates their registration
    /// @param recipientId ID of the recipient
    /// @param applicationId ID of the recipient"s application
    /// @param data The encoded data - (address recipientId, address recipientAddress, Metadata metadata)
    /// @param sender The sender of the transaction
    /// @param status The updated status of the recipient
    event UpdatedRegistration(
        address indexed recipientId,
        uint256 applicationId,
        bytes data,
        address sender,
        Status status
    );

    /// ======================
    /// ======= Storage ======
    /// ======================

    // slot 0
    /// @notice The total number of votes cast for all recipients
    uint256 public totalRecipientVotes;

    // slot 1
    /// @notice The number of votes required to review a recipient
    uint256 public reviewThreshold;

    // slot 2
    /// @notice The start and end times for registrations and allocations
    /// @dev The values will be in milliseconds since the epoch
    uint64 public registrationStartTime;
    uint64 public registrationEndTime;
    uint64 public allocationStartTime;
    uint64 public allocationEndTime;

    // slot 3
    /// @notice Whether or not the strategy is using registry gating
    bool public registryGating;

    /// @notice Whether or not the strategy requires metadata
    bool public metadataRequired;

    /// @notice Whether the distribution started or not
    bool public distributionStarted;

    /// @notice The maximum voice credits per allocator
    uint256 public maxVoiceCreditsPerAllocator;

    /// @notice The details of the allowed allocator
    /// @dev allocator => bool
    mapping(address => bool) public allowedAllocators;

    /// @notice The registry contract
    IRegistry private _registry;

    // @notice The registry contract address
    IRegistryIndexer private _registryIndexer;

    /// @notice The MACI factory contract
    // IMACIFactory public _maciFactory;

    MACI public _maci;

    MACI.PollContracts public _pollContracts;

    Poll public poll;

    Tally public tally;

    bool public isFinalized;

    address public coordinator; // coordinator address

    string public tallyHash;

    uint256 public totalTallyResults;

    // slots [4...n]
    /// @notice The status of the recipient for this strategy only
    /// @dev There is a core `IStrategy.RecipientStatus` that this should map to
    enum InternalRecipientStatus {
        None,
        Pending,
        Accepted,
        Rejected,
        Appealed
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
        // slot 4
        address coordinator;
        PubKey coordinatorPubKey;
    }

    struct InitializeParamsMACI {
        InitializeParams initializeParams;
        MACI maci;
        MACI.PollContracts pollContracts;
        address indexer;
    }

    /// @notice The details of the recipient
    struct Recipient {
        // slot 0
        uint256 totalVotesReceived;
        // slot 1
        bool useRegistryAnchor;
        address recipientAddress;
        Metadata metadata;
        Status recipientStatus;
        bool tallyVerified;
        // slot 2
        uint256 applicationId;
    }

    /// @notice The details of the recipient are returned using their ID
    /// @dev recipientId => Recipient
    mapping(address => Recipient) public recipients;

    /// @notice Returns whether or not the recipient has been paid out using their ID
    /// @dev recipientId => paid out
    mapping(address => bool) public paidOut;

    // recipientId -> applicationId -> status -> count
    mapping(address => mapping(uint256 => mapping(Status => uint256))) public reviewsByStatus;

    // recipientId -> applicationId -> reviewer -> status
    mapping(address => mapping(uint256 => mapping(address => Status))) public reviewedByManager;

    // recipientIndex to recipient address mapping
    mapping(uint256 => address) public recipientIndexToAddress;

    // mapping of recipientId to index in recipientIds array
    mapping(address => uint256) public recipientIdToIndex;

    /// ================================
    /// ========== Modifier ============
    /// ================================

    modifier onlyCoordinator() {
        if (msg.sender != coordinator) {
            revert NotCoordinator();
        }
        _;
    }

    /// @notice Modifier to check if the registration is active
    /// @dev Reverts if the registration is not active
    modifier onlyActiveRegistration() {
        _checkOnlyActiveRegistration();
        _;
    }

    /// @notice Modifier to check if the allocation has ended
    /// @dev Reverts if the allocation has not ended
    modifier onlyAfterAllocation() {
        _checkOnlyAfterAllocation();
        _;
    }

    /// @notice Modifier to check if the allocation has ended
    /// @dev This will revert if the allocation has ended.
    modifier onlyBeforeAllocationEnds() {
        _checkOnlyBeforeAllocationEnds();
        _;
    }

    /// ====================================
    /// ========== Constructor =============
    /// ====================================

    constructor(address _allo, string memory _name) BaseStrategy(_allo, _name) {}

    /// ====================================
    /// =========== Initialize =============
    /// ====================================

    /// @notice Initialize the strategy
    /// @param _poolId The ID of the pool
    /// @param _data The initialization data for the strategy
    /// @custom:data (InitializeParamsSimple)
    function initialize(uint256 _poolId, bytes memory _data) external virtual override onlyAllo {
        InitializeParamsMACI memory initializeParamsSimple = abi.decode(_data, (InitializeParamsMACI));
        __QVBaseStrategy_init(_poolId, initializeParamsSimple);

        maxVoiceCreditsPerAllocator = initializeParamsSimple.initializeParams.maxVoiceCreditsPerAllocator;
        emit Initialized(_poolId, _data);
    }

    /// @notice Internal initialize function
    /// @param _poolId The ID of the pool
    /// @param _paramsMaci The initialize params for the strategy
    function __QVBaseStrategy_init(uint256 _poolId, InitializeParamsMACI memory _paramsMaci) internal {
        InitializeParams memory _params = _paramsMaci.initializeParams;
        __BaseStrategy_init(_poolId);
        registryGating = _params.registryGating;
        metadataRequired = _params.metadataRequired;
        _registry = allo.getRegistry();

        reviewThreshold = _params.reviewThreshold;

        _updatePoolTimestamps(
            _params.registrationStartTime,
            _params.registrationEndTime,
            _params.allocationStartTime,
            _params.allocationEndTime
        );

        maxVoiceCreditsPerAllocator = _params.maxVoiceCreditsPerAllocator;

        _registryIndexer = IRegistryIndexer(_paramsMaci.indexer);

        coordinator = _params.coordinator;

        _registryIndexer.addMaciContracts(
            poolId,
            address(_paramsMaci.maci),
            _paramsMaci.pollContracts.poll,
            _paramsMaci.pollContracts.messageProcessor,
            _paramsMaci.pollContracts.tally,
            _paramsMaci.pollContracts.subsidy
        );
    }

    /// ================================
    /// ====== External/Public =========
    /// ================================

    /**
     * @dev Signup to this funding round.
     * @param pubKey Contributor"s public key.
     */
    function signup(PubKey calldata pubKey) external {
        if (isAddressZero(address(_maci))) revert MaciNotSet();
        if (isFinalized) revert RoundAlreadyFinalized();

        bytes memory signUpGatekeeperData = abi.encode(msg.sender, maxVoiceCreditsPerAllocator);
        bytes memory initialVoiceCreditProxyData = abi.encode(msg.sender);

        _maci.signUp(pubKey, signUpGatekeeperData, initialVoiceCreditProxyData);
    }

    /**
     * @dev Register user for voting.
     * This function is part of SignUpGatekeeper interface.
     * @param _data Encoded address of a contributor.
     */
    function register(address /* _caller */, bytes memory _data) public view {
        if (msg.sender != address(_maci)) {
            revert OnlyMaciCanRegisterVoters();
        }

        address user = abi.decode(_data, (address));
        bool verified = isVerifiedUser(user);

        if (!verified) {
            revert UserNotVerified();
        }
    }

    /**
     * @dev Set the tally contract
     * @param _tally The tally contract address
     */
    function _setTally(address _tally) private {
        if (isAddressZero(_tally)) {
            revert InvalidTally();
        }

        tally = Tally(_tally);
        emit TallySet(address(tally));
    }

    /**
     * @dev Have the votes been tallied
     */
    function isTallied() private view returns (bool) {
        (uint256 numSignUps, ) = poll.numSignUpsAndMessages();
        (uint8 intStateTreeDepth, , , ) = poll.treeDepths();
        uint256 tallyBatchSize = TREE_ARITY ** uint256(intStateTreeDepth);
        uint256 tallyBatchNum = tally.tallyBatchNum();
        uint256 totalTallied = tallyBatchNum * tallyBatchSize;

        return numSignUps > 0 && totalTallied >= numSignUps;
    }

    /**
     * @dev Publish the IPFS hash of the vote tally. Only coordinator can publish.
     * @param _tallyHash IPFS hash of the vote tally.
     */
    function publishTallyHash(string calldata _tallyHash) external onlyCoordinator {
        if (isFinalized) {
            revert RoundAlreadyFinalized();
        }
        if (bytes(_tallyHash).length == 0) {
            revert EmptyTallyHash();
        }

        tallyHash = _tallyHash;
        emit TallyPublished(_tallyHash);
    }

    /**
     * @dev Get the total amount of votes from MACI,
     * verify the total amount of spent voice credits across all recipients,
     * calculate the quadratic alpha value,
     * and allow recipients to claim funds.
     * @param _totalSpent Total amount of spent voice credits.
     * @param _totalSpentSalt The salt.
     */
    function finalize(
        uint256 _totalSpent,
        uint256 _totalSpentSalt,
        uint256 _newResultCommitment,
        uint256 _perVOSpentVoiceCreditsHash
    ) external onlyPoolManager(msg.sender) {
        if (isFinalized) {
            revert RoundAlreadyFinalized();
        }

        if (isAddressZero(address(_maci))) revert MaciNotSet();

        _votingPeriodOver(poll);

        if (!isTallied()) {
            revert VotesNotTallied();
        }
        if (bytes(tallyHash).length == 0) {
            revert TallyHashNotPublished();
        }

        // make sure we have received all the tally results
        (, , , uint8 voteOptionTreeDepth) = poll.treeDepths();
        uint256 totalResults = uint256(TREE_ARITY) ** uint256(voteOptionTreeDepth);
        if (totalTallyResults != totalResults) {
            revert IncompleteTallyResults(totalResults, totalTallyResults);
        }

        // If nobody voted, the round should be cancelled to avoid locking of matching funds
        if (_totalSpent == 0) {
            revert NoVotes();
        }

        bool verified = tally.verifySpentVoiceCredits(
            _totalSpent,
            _totalSpentSalt,
            _newResultCommitment,
            _perVOSpentVoiceCreditsHash
        );

        if (!verified) {
            revert IncorrectSpentVoiceCredits();
        }

        // totalRecipientVotes = _totalSpent;

        isFinalized = true;
    }

    /**
     * @dev Add and verify tally votes and calculate sum of tally squares for alpha calculation.
     * @param _voteOptionIndex Vote option index.
     * @param _tallyResult The results of vote tally for the recipients.
     * @param _tallyResultProof Proofs of correctness of the vote tally results.
     * @param _tallyResultSalt the respective salt in the results object in the tally.json
     * @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
     * @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
     */
    function _addTallyResult(
        uint256 _voteOptionIndex,
        uint256 _tallyResult,
        uint256[][] memory _tallyResultProof,
        uint256 _tallyResultSalt,
        uint256 _spentVoiceCreditsHash,
        uint256 _perVOSpentVoiceCreditsHash
    ) external onlyCoordinator {
        (, , , uint8 voteOptionTreeDepth) = poll.treeDepths();
        bool resultVerified = tally.verifyTallyResult(
            _voteOptionIndex,
            _tallyResult,
            _tallyResultProof,
            _tallyResultSalt,
            voteOptionTreeDepth,
            _spentVoiceCreditsHash,
            _perVOSpentVoiceCreditsHash
        );

        if (!resultVerified) {
            revert IncorrectTallyResult();
        }

        _allocate(_voteOptionIndex, _tallyResult);

        totalTallyResults++;

        emit TallyResultsAdded(_voteOptionIndex, _tallyResult);
    }

    /// =========================
    /// ==== View Functions =====
    /// =========================

    function isAddressZero(address _address) internal pure returns (bool) {
        return _address == address(0);
    }

    /// @notice Get the recipient
    /// @param _recipientId ID of the recipient
    /// @return The recipient
    function getRecipient(address _recipientId) external view returns (Recipient memory) {
        return _getRecipient(_recipientId);
    }

    /// @notice Get recipient status
    /// @param _recipientId Id of the recipient
    function _getRecipientStatus(address _recipientId) internal view override returns (Status) {
        return _getRecipient(_recipientId).recipientStatus;
    }

    /// @notice Checks if a pool is active or not
    /// @return Whether the pool is active or not
    function _isPoolActive() internal view override returns (bool) {
        if (registrationStartTime <= block.timestamp && block.timestamp <= registrationEndTime) {
            return true;
        }
        return false;
    }

    /// @notice Add allocator
    /// @dev Only the pool manager(s) can call this function and emits an `AllocatorAdded` event
    /// @param _allocator The allocator address
    function addAllocator(address _allocator) external onlyPoolManager(msg.sender) {
        allowedAllocators[_allocator] = true;

        emit AllocatorAdded(_allocator, msg.sender);
    }

    /// @notice Remove allocator
    /// @dev Only the pool manager(s) can call this function and emits an `AllocatorRemoved` event
    /// @param _allocator The allocator address
    function removeAllocator(address _allocator) external onlyPoolManager(msg.sender) {
        allowedAllocators[_allocator] = false;

        emit AllocatorRemoved(_allocator, msg.sender);
    }

    /// @notice Allocate votes to a recipient
    /// @param _data The data
    /// @param _sender The sender of the transaction
    /// @dev Only the pool manager(s) can call this function
    function _allocate(bytes memory _data, address _sender) internal override {}

    /// @notice Allocate votes to a recipient
    /// @param _voteOptionIndex The vote option index
    /// @param _voiceCreditsToAllocate The voice credits to allocate
    /// @dev Only the pool manager(s) can call this function
    function _allocate(uint256 _voteOptionIndex, uint256 _voiceCreditsToAllocate) internal {
        address recipientId = recipientIndexToAddress[_voteOptionIndex];

        // spin up the structs in storage for updating
        Recipient storage recipient = recipients[recipientId];

        if (recipient.tallyVerified) {
            revert VoteResultsAlreadyVerified();
        }

        recipient.tallyVerified = true;

        // check that the recipient is accepted
        if (!_isAcceptedRecipient(recipientId)) revert RECIPIENT_ERROR(recipientId);

        _registryIndexer.InsertAllocation(poolId, _voiceCreditsToAllocate, recipientId);

        _qv_allocate(recipient, recipientId, _voiceCreditsToAllocate);
    }

    /// @notice Returns if the recipient is accepted
    /// @param _recipientId The recipient id
    /// @return true if the recipient is accepted
    function _isAcceptedRecipient(address _recipientId) internal view returns (bool) {
        return recipients[_recipientId].recipientStatus == Status.Accepted;
    }

    /// @notice Checks if the allocator is valid
    /// @param _allocator The allocator address
    /// @return true if the allocator is valid
    function _isValidAllocator(address _allocator) internal view override returns (bool) {
        return allowedAllocators[_allocator];
    }

    /**
     * @dev Check if the user is verified.
     */
    function isVerifiedUser(address _allocator) public view returns (bool) {
        return _isValidAllocator(_allocator);
    }

    /**
     * @dev Get the amount of voice credits for a given address.
     * This function is a part of the InitialVoiceCreditProxy interface.
     * @param _data Encoded address of a user.
     */
    function getVoiceCredits(address /* _caller */, bytes memory _data) public view returns (uint256) {
        address user = abi.decode(_data, (address));
        if (_isValidAllocator(user)) {
            return 0;
        }
        return maxVoiceCreditsPerAllocator;
    }

    /// @notice Review recipient(s) application(s)
    /// @dev You can review multiple recipients at once or just one. This can only be called by a pool manager and
    ///      only during active registration.
    /// @param _recipientIds Ids of the recipients
    /// @param _recipientStatuses Statuses of the recipients
    function reviewRecipients(
        address[] calldata _recipientIds,
        Status[] calldata _recipientStatuses
    ) external onlyPoolManager(msg.sender) onlyBeforeAllocationEnds {
        // make sure the arrays are the same length
        uint256 recipientLength = _recipientIds.length;
        if (recipientLength != _recipientStatuses.length) revert INVALID();

        uint8[] memory statuses = new uint8[](recipientLength);

        for (uint256 i; i < recipientLength; ) {
            Status recipientStatus = _recipientStatuses[i];
            statuses[i] = uint8(recipientStatus);
            address recipientId = _recipientIds[i];
            Recipient storage recipient = recipients[recipientId];
            uint256 applicationId = recipient.applicationId;

            // if the status is none or appealed then revert
            if (recipientStatus == Status.None || recipientStatus == Status.Appealed) {
                revert RECIPIENT_ERROR(recipientId);
            }

            if (reviewedByManager[recipientId][applicationId][msg.sender] > Status.None) {
                revert RECIPIENT_ERROR(recipientId);
            }

            // track the review cast for the recipient and update status counter
            reviewedByManager[recipientId][applicationId][msg.sender] = recipientStatus;
            reviewsByStatus[recipientId][applicationId][recipientStatus]++;

            // update the recipient status if the review threshold has been reached
            if (reviewsByStatus[recipientId][applicationId][recipientStatus] >= reviewThreshold) {
                recipient.recipientStatus = recipientStatus;

                // Changes for QVMACIStrategy
                if (recipientStatus == Status.Accepted) {
                    // Adding the recipient to the registry so that we have a voting option on MACI
                    addRecipient(recipientId);
                }

                emit RecipientStatusUpdated(recipientId, applicationId, recipientStatus, address(0));
            }

            emit Reviewed(recipientId, applicationId, recipientStatus, msg.sender);

            unchecked {
                ++i;
            }
        }
        _registryIndexer.InsertReviews(poolId, msg.sender, statuses, _recipientIds);
    }

    /// @notice Set the start and end dates for the pool
    /// @param _registrationStartTime The start time for the registration
    /// @param _registrationEndTime The end time for the registration
    /// @param _allocationStartTime The start time for the allocation
    /// @param _allocationEndTime The end time for the allocation
    function updatePoolTimestamps(
        uint64 _registrationStartTime,
        uint64 _registrationEndTime,
        uint64 _allocationStartTime,
        uint64 _allocationEndTime
    ) external onlyPoolManager(msg.sender) {
        _updatePoolTimestamps(_registrationStartTime, _registrationEndTime, _allocationStartTime, _allocationEndTime);
    }

    /// @notice Withdraw the tokens from the pool
    /// @dev Callable by the pool manager only 30 days after the allocation has ended
    /// @param _token The token to withdraw
    function withdraw(address _token) external onlyPoolManager(msg.sender) {
        if (block.timestamp <= allocationEndTime + 30 days) {
            revert INVALID();
        }

        uint256 amount = _getBalance(_token, address(this));

        // Transfer the tokens to the "msg.sender" (pool manager calling function)
        _transferAmount(_token, msg.sender, amount);
    }

    /// ====================================
    /// ============ Internal ==============
    /// ====================================

    /// @notice Check if the registration is active
    /// @dev Reverts if the registration is not active
    function _checkOnlyActiveRegistration() internal view {
        if (registrationStartTime > block.timestamp || block.timestamp > registrationEndTime) {
            revert REGISTRATION_NOT_ACTIVE();
        }
    }

    /// @notice Check if the allocation has ended
    /// @dev Reverts if the allocation has not ended
    function _checkOnlyAfterAllocation() internal view {
        if (block.timestamp <= allocationEndTime) revert ALLOCATION_NOT_ENDED();
    }

    /// @notice Checks if the allocation has not ended and reverts if it has.
    /// @dev This will revert if the allocation has ended.
    function _checkOnlyBeforeAllocationEnds() internal view {
        if (block.timestamp > allocationEndTime) {
            revert ALLOCATION_NOT_ACTIVE();
        }
    }

    /// @notice Set the start and end dates for the pool
    /// @param _registrationStartTime The start time for the registration
    /// @param _registrationEndTime The end time for the registration
    /// @param _allocationStartTime The start time for the allocation
    /// @param _allocationEndTime The end time for the allocation
    function _updatePoolTimestamps(
        uint64 _registrationStartTime,
        uint64 _registrationEndTime,
        uint64 _allocationStartTime,
        uint64 _allocationEndTime
    ) internal {
        // validate the timestamps for this strategy
        if (
            block.timestamp > _registrationStartTime ||
            _registrationStartTime > _registrationEndTime ||
            _registrationStartTime > _allocationStartTime ||
            _allocationStartTime > _allocationEndTime ||
            _registrationEndTime > _allocationEndTime
        ) {
            revert INVALID();
        }

        // Set the new values
        registrationStartTime = _registrationStartTime;
        registrationEndTime = _registrationEndTime;
        allocationStartTime = _allocationStartTime;
        allocationEndTime = _allocationEndTime;

        // emit the event
        emit TimestampsUpdated(
            registrationStartTime,
            registrationEndTime,
            allocationStartTime,
            allocationEndTime,
            msg.sender
        );
    }

    /// @notice Submit application to pool
    /// @dev The "_data" parameter is encoded as follows:
    ///     - If registryGating is true, then the data is encoded as (address recipientId, address recipientAddress, Metadata metadata)
    ///     - If registryGating is false, then the data is encoded as (address recipientAddress, address registryAnchor, Metadata metadata)
    /// @param _data The data to be decoded
    /// @param _sender The sender of the transaction
    /// @return recipientId The ID of the recipient
    function _registerRecipient(
        bytes memory _data,
        address _sender
    ) internal override onlyActiveRegistration returns (address recipientId) {
        address recipientAddress;
        address registryAnchor;
        bool isUsingRegistryAnchor;

        Metadata memory metadata;

        // decode data custom to this strategy
        if (registryGating) {
            (recipientId, recipientAddress, metadata) = abi.decode(_data, (address, address, Metadata));

            // when registry gating is enabled, the recipientId must be a profile member
            if (!_isProfileMember(recipientId, _sender)) revert UNAUTHORIZED();
        } else {
            (recipientAddress, registryAnchor, metadata) = abi.decode(_data, (address, address, Metadata));
            isUsingRegistryAnchor = !isAddressZero(registryAnchor);
            recipientId = isUsingRegistryAnchor ? registryAnchor : recipientAddress;

            // when using registry anchor, the ID of the recipient must be a profile member
            if (isUsingRegistryAnchor && !_isProfileMember(recipientId, _sender)) revert UNAUTHORIZED();
        }

        // make sure that if metadata is required, it is provided
        if (metadataRequired && (bytes(metadata.pointer).length == 0 || metadata.protocol == 0)) {
            revert INVALID_METADATA();
        }

        // make sure the recipient address is not the zero address
        if (isAddressZero(recipientAddress)) revert RECIPIENT_ERROR(recipientId);

        Recipient storage recipient = recipients[recipientId];

        // update the recipients data
        recipient.recipientAddress = recipientAddress;
        recipient.metadata = metadata;
        recipient.useRegistryAnchor = registryGating ? true : isUsingRegistryAnchor;
        ++recipient.applicationId;

        Status currentStatus = recipient.recipientStatus;

        if (currentStatus == Status.None) {
            // recipient registering new application
            recipient.recipientStatus = Status.Pending;

            _registryIndexer.RegisterProfile(recipientId, poolId, metadata.pointer);

            emit Registered(recipientId, _data, _sender);
        } else {
            // recipient updating rejected/pending/appealed/accepted application
            if (currentStatus == Status.Rejected) {
                recipient.recipientStatus = Status.Appealed;
            } else if (currentStatus == Status.Accepted) {
                // recipient updating already accepted application
                recipient.recipientStatus = Status.Pending;
            }

            // emit the new status with the "_data" that was passed in
            emit UpdatedRegistration(recipientId, recipient.applicationId, _data, _sender, recipient.recipientStatus);
        }
    }

    /// @notice Distribute the tokens to the recipients
    /// @dev The "_sender" must be a pool manager and the allocation must have ended
    /// @param _recipientIds The recipient ids
    /// @param _sender The sender of the transaction
    function _distribute(
        address[] memory _recipientIds,
        bytes memory,
        address _sender
    ) internal override onlyPoolManager(_sender) onlyAfterAllocation {
        uint256 payoutLength = _recipientIds.length;

        uint256[] memory payouts = new uint256[](payoutLength);

        for (uint256 i; i < payoutLength; ) {
            address recipientId = _recipientIds[i];
            Recipient storage recipient = recipients[recipientId];

            PayoutSummary memory payout = _getPayout(recipientId, "");
            uint256 amount = payout.amount;

            payouts[i] = amount;

            if (paidOut[recipientId] || !_isAcceptedRecipient(recipientId) || amount == 0) {
                revert RECIPIENT_ERROR(recipientId);
            }

            IAllo.Pool memory pool = allo.getPool(poolId);
            _transferAmount(pool.token, recipient.recipientAddress, amount);

            paidOut[recipientId] = true;

            emit Distributed(recipientId, recipient.recipientAddress, amount, _sender);
            unchecked {
                ++i;
            }
        }

        _registryIndexer.InsertDistributions(poolId, payouts, _recipientIds);

        if (!distributionStarted) {
            distributionStarted = true;
        }
    }

    /// @notice Check if sender is a profile member
    /// @param _anchor Anchor of the profile
    /// @param _sender The sender of the transaction
    /// @return If the "_sender" is a profile member
    function _isProfileMember(address _anchor, address _sender) internal view returns (bool) {
        IRegistry.Profile memory profile = _registry.getProfileByAnchor(_anchor);
        return _registry.isOwnerOrMemberOfProfile(profile.id, _sender);
    }

    /// @notice Getter for a recipient using the ID
    /// @param _recipientId ID of the recipient
    /// @return The recipient
    function _getRecipient(address _recipientId) internal view returns (Recipient memory) {
        return recipients[_recipientId];
    }

    /// ====================================
    /// ============ QV Helper ==============
    /// ====================================

    /// @notice Calculate the square root of a number (Babylonian method)
    /// @param x The number
    /// @return y The square root
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /// @notice Allocate voice credits to a recipient
    /// @dev This can only be called during active allocation period
    /// _allocator The allocator details
    /// @param _recipient The recipient details
    /// @param _recipientId The ID of the recipient
    /// @param _voiceCreditsToAllocate The voice credits to allocate to the recipient
    /// _sender The sender of the transaction
    function _qv_allocate(
        Recipient storage _recipient,
        address _recipientId,
        uint256 _voiceCreditsToAllocate
    ) internal {
        // check the `_voiceCreditsToAllocate` is > 0
        if (_voiceCreditsToAllocate == 0) revert INVALID();

        // check if the recipient is accepted
        if (!_isAcceptedRecipient(_recipientId)) revert RECIPIENT_ERROR(_recipientId);

        // determine actual votes cast
        uint256 voteResult = _sqrt(_voiceCreditsToAllocate * 1e18);

        // update the values
        totalRecipientVotes += voteResult;
        _recipient.totalVotesReceived = voteResult;

        // emit the event with the vote results
        emit Allocated(_recipientId, voteResult, address(this));
    }

    /// @notice Add a recipient to the MACI contract
    /// @param _recipientId The ID of the recipient
    function addRecipient(address _recipientId) internal {
        uint256 recipientIndex = uint256(keccak256(abi.encode(_recipientId)));
        recipientIdToIndex[_recipientId] = recipientIndex;
        recipientIndexToAddress[recipientIndex] = _recipientId;
    }

    /// @notice Get the payout for a single recipient
    /// @param _recipientId The ID of the recipient
    /// @return The payout as a "PayoutSummary" struct
    function _getPayout(address _recipientId, bytes memory) internal view override returns (PayoutSummary memory) {
        Recipient memory recipient = recipients[_recipientId];

        // Calculate the payout amount based on the percentage of total votes
        uint256 amount;
        if (!paidOut[_recipientId] && totalRecipientVotes != 0) {
            amount = (poolAmount * recipient.totalVotesReceived) / totalRecipientVotes;
        }
        return PayoutSummary(recipient.recipientAddress, amount);
    }

    function _beforeIncreasePoolAmount(uint256) internal view override {
        if (distributionStarted) {
            revert INVALID();
        }
    }

    /// @notice Contract should be able to receive NATIVE
    receive() external payable {}
}
