// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

// External Libraries
import { Constants, Metadata, IRegistry, IAllo } from "./interfaces/Constants.sol";

import { Multicall } from "@openzeppelin/contracts/utils/Multicall.sol";

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

// Core Contracts
import { BaseStrategy } from "../BaseStrategy.sol";


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

abstract contract QFMACIBase is BaseStrategy, Multicall, Constants {
    /// ======================
    /// ======= Storage ======
    /// ======================
    using Counters for Counters.Counter;

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

    /// @notice The registry contract
    IRegistry private _registry;


    // Constants
    uint256 public constant MAX_VOICE_CREDITS = 10 ** 9;  // MACI allows 2 ** 32 voice credits max
    uint256 public constant MAX_CONTRIBUTION_AMOUNT = 10 ** 4;  // In tokens
    uint256 public constant ALPHA_PRECISION = 10 ** 18; // to account for loss of precision in division

    /// @notice The details of the total credits per Contributor "allocator"
    /// @dev address => uint256
    mapping(address => uint256) public contributorCredits;

    Counters.Counter private _recipientCounter;

    uint256 public voiceCreditFactor;

    uint256 public totalVotesSquares;

    /// @notice The status of pool true after Coordinator has finalized the pool
    // By submitting the final tally ZK proof verified by the Tally contract
    bool public isFinalized;

    // The alpha used in quadratic funding formula
    uint256 public alpha;

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

    // recipientId -> applicationId -> status -> count
    mapping(address => mapping(uint256 => mapping(Status => uint256))) public reviewsByStatus;

    // recipientId -> applicationId -> reviewer -> status
    mapping(address => mapping(uint256 => mapping(address => Status))) public reviewedByManager;

    // recipientIndex to recipient address mapping
    mapping(uint256 => address) public recipientIndexToAddress;

    // mapping of recipientId to index in recipientIds array
    mapping(address => uint256) public recipientIdToIndex;

    /// @notice The details of the recipient are returned using their ID
    /// @dev recipientId => Recipient
    mapping(address => Recipient) public recipients;

    /// @notice Returns whether or not the recipient has been paid out using their ID
    /// @dev recipientId => paid out
    mapping(address => bool) public paidOut;

    /// ================================
    /// ========== Modifier ============
    /// ================================

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

    constructor(address _allo, string memory _name) BaseStrategy(_allo, _name) {
    }

    /// ====================================
    /// =========== Initialize =============
    /// ====================================

    /// @notice Internal initialize function
    /// @param _poolId The ID of the pool
    /// @param _params The initialize params for the strategy
    function __QVBaseStrategy_init(uint256 _poolId, InitializeParams memory _params) internal {
        __BaseStrategy_init(_poolId);
        registryGating = _params.registryGating;
        metadataRequired = _params.metadataRequired;
        _registry = allo.getRegistry();

        reviewThreshold = _params.reviewThreshold;
        voiceCreditFactor = (MAX_CONTRIBUTION_AMOUNT * uint256(10) ** 18) / MAX_VOICE_CREDITS;
        voiceCreditFactor = voiceCreditFactor > 0 ? voiceCreditFactor : 1;

        _updatePoolTimestamps(
            _params.registrationStartTime,
            _params.registrationEndTime,
            _params.allocationStartTime,
            _params.allocationEndTime
        );
    }

    /// ================================
    /// ====== External/Public =========
    /// ================================

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

                // Changes for QFMACIStrategy
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

    /// @notice Contract should be able to receive NATIVE
    receive() external payable {}

    /// ====================================
    /// ============ Internal ==============
    /// ====================================

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
    /// @dev The '_data' parameter is encoded as follows:
    ///     - If registryGating is true, then the data is encoded as (address recipientId, address recipientAddress, Metadata metadata)
    ///     - If registryGating is false, then the data is encoded as (address recipientAddress, address registryAnchor, Metadata metadata)
    /// @param _data The data to be decoded
    /// @param _sender The sender of the transaction
    /// @return recipientId The ID of the recipient
    function _registerRecipient(
        bytes memory _data,
        address _sender
    ) internal virtual override onlyActiveRegistration returns (address recipientId) {
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
            isUsingRegistryAnchor = registryAnchor != address(0);
            recipientId = isUsingRegistryAnchor ? registryAnchor : _sender;

            // when using registry anchor, the ID of the recipient must be a profile member
            if (isUsingRegistryAnchor && !_isProfileMember(recipientId, _sender)) revert UNAUTHORIZED();
        }

        // make sure that if metadata is required, it is provided
        if (metadataRequired && (bytes(metadata.pointer).length == 0 || metadata.protocol == 0)) {
            revert INVALID_METADATA();
        }

        // make sure the recipient address is not the zero address
        if (recipientAddress == address(0)) revert RECIPIENT_ERROR(recipientId);

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
            emit Registered(recipientId, _data, _sender);
        } else {
            // recipient updating rejected/pending/appealed/accepted application
            if (currentStatus == Status.Rejected) {
                recipient.recipientStatus = Status.Appealed;
            } else if (currentStatus == Status.Accepted) {
                // recipient updating already accepted application
                recipient.recipientStatus = Status.Pending;
            }

            // emit the new status with the '_data' that was passed in
            emit UpdatedRegistration(recipientId, recipient.applicationId, _data, _sender, recipient.recipientStatus);
        }
    }

    /// @notice Add a recipient to the MACI contract
    /// @param _recipientId The ID of the recipient
    function addRecipient(address _recipientId) internal {
        _recipientCounter.increment();
        uint256 recipientIndex = _recipientCounter.current();
        recipientIdToIndex[_recipientId] = recipientIndex;
        recipientIndexToAddress[recipientIndex] = _recipientId;
        emit RecipientVotingOptionAdded(_recipientId, recipientIndex);
    }

    /// =========================
    /// ==== View Functions =====
    /// =========================

    /// @notice Get the total number of recipients
    /// @return The total number of recipients
    function getRecipientCount() external view returns (uint256) {
        return _recipientCounter.current();
    }

    /// @notice Get recipient status
    /// @param _recipientId Id of the recipient
    function _getRecipientStatus(address _recipientId) internal view override returns (Status) {
        return recipients[_recipientId].recipientStatus;
    }

    /// @notice Checks if a pool is active or not
    /// @return Whether the pool is active or not
    function _isPoolActive() internal view override returns (bool) {
        if (registrationStartTime <= block.timestamp && block.timestamp <= registrationEndTime) {
            return true;
        }
        return false;
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
        return contributorCredits[_allocator] > 0;
    }

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

    /// @notice Get the payout for a single recipient
    /// @param _recipientId The ID of the recipient
    /// @return _payoutSummary payout as a "PayoutSummary" struct
    function _getPayout(address _recipientId, bytes memory data) internal view override returns (PayoutSummary memory _payoutSummary) {}

    /**
     * @dev Get the amount of voice credits for a given address.
     * This function is a part of the InitialVoiceCreditProxy interface.
     * @param _data Encoded address of a user.
     */
    function getVoiceCredits(address /* _caller */, bytes memory _data) external view returns (uint256) {
        address _allocator = abi.decode(_data, (address));
        if (!_isValidAllocator(_allocator)) {
            return 0;
        }
        return contributorCredits[_allocator];
    }

    function _beforeIncreasePoolAmount(uint256) internal view override {
        if (distributionStarted) {
            revert INVALID();
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


    /// ====================================
    /// ============ QV Helper ==============
    /// ====================================

    /**
        * @dev Calculate the alpha for the capital constrained quadratic formula
        *  in page 17 of https://arxiv.org/pdf/1809.06421.pdf
        * @param _budget Total budget of the round to be distributed
        * @param _totalVotesSquares Total of the squares of votes
        * @param _totalSpent Total amount of spent voice credits
    */
    function calcAlpha(
        uint256 _budget,
        uint256 _totalVotesSquares,
        uint256 _totalSpent
    )
        internal
        view
        returns (uint256 _alpha)
    {
        // make sure budget = contributions + matching pool
        uint256 contributions = _totalSpent * voiceCreditFactor;

        if (_budget < contributions) {
        revert ("InvalidBudget");
        }

        // guard against division by zero.
        // This happens when no project receives more than one vote
        if (_totalVotesSquares <= _totalSpent) {
        revert("NoProjectHasMoreThanOneVote");
        }

        return  (_budget - contributions) * ALPHA_PRECISION /
                (voiceCreditFactor * (_totalVotesSquares - _totalSpent));

    }

    /**
        * @dev Get allocated token amount (without verification).
        * @param _tallyResult The result of vote tally for the recipient.
        * @param _spent The amount of voice credits spent on the recipient.
    */
    function getAllocatedAmount(
        uint256 _tallyResult,
        uint256 _spent
    )
        internal
        view
        returns (uint256)
    {
        // amount = ( alpha * (quadratic votes)^2 + (precision - alpha) * totalSpent ) / precision
        uint256 quadratic = alpha * voiceCreditFactor * _tallyResult * _tallyResult;
        uint256 totalSpentCredits = voiceCreditFactor * _spent;
        uint256 linearPrecision = ALPHA_PRECISION * totalSpentCredits;
        uint256 linearAlpha = alpha * totalSpentCredits;
        return ((quadratic + linearPrecision) - linearAlpha) / ALPHA_PRECISION;
    }
}
