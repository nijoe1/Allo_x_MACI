// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

// External Libraries
import {Constants, Metadata, IRegistry, IAllo, IVerifier} from "./interfaces/Constants.sol";

import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

// Core Contracts
import {BaseStrategy} from "../BaseStrategy.sol";

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

   /// ================================
    /// ========== Struct ==============
    /// ================================

    /// @notice Struct to hold details of the application status
    /// @dev Application status is stored in a bitmap. Each 4 bits represents the status of a recipient,
    /// defined as 'index' here. The first 4 bits of the 256 bits represent the status of the first recipient,
    /// the second 4 bits represent the status of the second recipient, and so on.
    ///
    /// The 'rowIndex' is the index of the row in the bitmap, and the 'statusRow' is the value of the row.
    /// The 'statusRow' is updated when the status of a recipient changes.
    ///
    /// Note: Since we need 4 bits to store a status, one row of the bitmap can hold the status information of 256/4 recipients.
    ///
    /// For example, if we have 5 recipients, the bitmap will look like this:
    /// | recipient1 | recipient2 | recipient3 | recipient4 | recipient5 | 'rowIndex'
    /// |     0000   |    0001    |    0010    |    0011    |    0100    | 'statusRow'
    /// |     none   |   pending  |  accepted  |  rejected  |  appealed  | converted status (0, 1, 2, 3, 4)
    ///
    struct ApplicationStatus {
        uint256 index;
        uint256 statusRow;
    }

    /// @notice The parameters used to initialize the strategy
    struct InitializeParams {
        // slot 0
        bool useRegistryAnchor;
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
        bool useRegistryAnchor;
        address recipientAddress;
        Metadata metadata;
        uint256 totalVotesReceived;
        bool tallyVerified;
    }
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

    /// @notice Flag to indicate whether to use the registry anchor or not.
    bool public useRegistryAnchor;

    /// @notice Flag to indicate whether metadata is required or not.
    bool public metadataRequired;


    /// @notice The registry contract
    IRegistry private _registry;

    /// @notice The total number of recipients.
    uint256 public recipientsCounter;

    /// @notice This is a packed array of booleans, 'statuses[0]' is the first row of the bitmap and allows to
    /// store 256 bits to describe the status of 256 projects. 'statuses[1]' is the second row, and so on
    /// Instead of using 1 bit for each recipient status, we will use 4 bits for each status
    /// to allow 5 statuses:
    /// 0: none
    /// 1: pending
    /// 2: accepted
    /// 3: rejected
    /// 4: appealed
    /// Since it's a mapping the storage it's pre-allocated with zero values, so if we check the
    /// status of an existing recipient, the value is by default 0 (none).
    /// If we want to check the status of an recipient, we take its index from the `recipients` array
    /// and convert it to the 2-bits position in the bitmap.
    mapping(uint256 => uint256) public statusesBitMap;

    /// @notice 'recipientId' => 'statusIndex'
    /// @dev 'statusIndex' is the index of the recipient in the 'statusesBitMap' bitmap.
    mapping(address => uint256) public recipientToStatusIndexes;

    mapping(uint256 => address) public recipientIndexToAddress;

    /// @notice This is a packed array of booleans to keep track of claims distributed.
    /// @dev distributedBitMap[0] is the first row of the bitmap and allows to store 256 bits to describe
    /// the status of 256 claims
    mapping(uint256 => uint256) private distributedBitMap;


    uint256 public voiceCreditFactor;

    uint256 public totalVotesSquares;

    uint256 public matchingPoolSize;

    uint256 public totalContributed;

    uint256 public totalSpent;

    /// @notice The status of pool true after Coordinator has finalized the pool
    // By submitting the final tally ZK proof verified by the Tally contract
    bool public isFinalized;

    bool public isCancelled;

    // The alpha used in quadratic funding formula
    uint256 public alpha;


    address public coordinator; // coordinator address

    IVerifier public verifier;

    string public tallyHash;

    address public _maci;

    /// @notice The details of the recipient are returned using their ID
    /// @dev recipientId => Recipient
    mapping(address => Recipient) public _recipients;

    /// @notice The details of the total credits per Contributor "allocator"
    /// @dev address => uint256
    mapping(address => uint256) public contributorCredits;


    /// ================================
    /// ========== Modifier ============
    /// ================================

    /// @notice Modifier to check if the caller is the coordinator
    /// @dev Reverts if the caller is not the coordinator
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

    /// @notice Internal initialize function
    /// @param _poolId The ID of the pool
    /// @param _params The initialize params for the strategy
    function __QFMACIBaseStrategy_init(uint256 _poolId, InitializeParams memory _params) internal {
        __BaseStrategy_init(_poolId);
        useRegistryAnchor = _params.useRegistryAnchor;
        metadataRequired = _params.metadataRequired;
        _registry = allo.getRegistry();

        reviewThreshold = _params.reviewThreshold;
        voiceCreditFactor = (MAX_CONTRIBUTION_AMOUNT * uint256(10) ** 18) / MAX_VOICE_CREDITS;
        voiceCreditFactor = voiceCreditFactor > 0 ? voiceCreditFactor : 1;

        recipientsCounter = 1;

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

    /// @notice Sets recipient statuses.
    /// @dev The statuses are stored in a bitmap of 4 bits for each recipient. The first 4 bits of the 256 bits represent
    ///      the status of the first recipient, the second 4 bits represent the status of the second recipient, and so on.
    ///      'msg.sender' must be a pool manager and the registration must be active.
    /// Statuses:
    /// - 0: none
    /// - 1: pending
    /// - 2: accepted
    /// - 3: rejected
    /// - 4: appealed
    /// Emits the RecipientStatusUpdated() event.
    /// @param statuses new statuses
    /// @param refRecipientsCounter the recipientCounter the transaction is based on
    function reviewRecipients(ApplicationStatus[] memory statuses, uint256 refRecipientsCounter)
        external
        onlyBeforeAllocationEnds
        onlyPoolManager(msg.sender)
    {
        if (refRecipientsCounter != recipientsCounter) revert INVALID();
        // Loop through the statuses and set the status
        for (uint256 i; i < statuses.length;) {
            uint256 rowIndex = statuses[i].index;
            uint256 fullRow = statuses[i].statusRow;

            statusesBitMap[rowIndex] = fullRow;

            // Emit that the recipient status has been updated with the values
            emit RecipientStatusUpdated(rowIndex, fullRow, msg.sender);

            unchecked {
                i++;
            }
        }
    }

    /// @notice Withdraw the tokens from the pool
    /// @dev Callable by the pool manager only if the pool has been cancelled
    /// @param _token The token to withdraw
    function withdraw(address _token) external onlyPoolManager(msg.sender) {
        if (!isCancelled) {
            revert INVALID();
        }

        // Get the amount of tokens that the pool has subtracting the totalContributed amount
        // This is to prevent the pool manager from withdrawing the funds that were contributed
        uint256 amount = _getBalance(_token, address(this)) - totalContributed;

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

    /// @notice Get a recipient with a '_recipientId'
    /// @param _recipientId ID of the recipient
    /// @return recipient The recipient details
    function getRecipient(address _recipientId) external view returns (Recipient memory recipient) {
        return _recipients[_recipientId];
    }

    /// ===============================
    /// ======= External/Custom =======
    /// ===============================

    /// @notice Submit recipient to pool and set their status.
    /// @param _data The data to be decoded.
    /// @custom:data if 'useRegistryAnchor' is 'true' (address recipientId, address recipientAddress, Metadata metadata)
    /// @custom:data if 'useRegistryAnchor' is 'false' (address registryAnchor, address recipientAddress, Metadata metadata)
    /// @param _sender The sender of the transaction
    /// @return recipientId The ID of the recipient
    function _registerRecipient(bytes memory _data, address _sender)
        internal
        override
        onlyActiveRegistration
        returns (address recipientId)
    {
        bool isUsingRegistryAnchor;
        address recipientAddress;
        address registryAnchor;
        Metadata memory metadata;

        // decode data custom to this strategy
        if (useRegistryAnchor) {
            (recipientId, recipientAddress, metadata) = abi.decode(_data, (address, address, Metadata));

            // If the sender is not a profile member this will revert
            if (!_isProfileMember(recipientId, _sender)) {
                revert UNAUTHORIZED();
            }
        } else {
            (registryAnchor, recipientAddress, metadata) = abi.decode(_data, (address, address, Metadata));

            // Set this to 'true' if the registry anchor is not the zero address
            isUsingRegistryAnchor = registryAnchor != address(0);

            // If using the 'registryAnchor' we set the 'recipientId' to the 'registryAnchor', otherwise we set it to the 'msg.sender'
            recipientId = isUsingRegistryAnchor ? registryAnchor : _sender;

            // Checks if the '_sender' is a member of the profile 'anchor' being used and reverts if not
            if (isUsingRegistryAnchor && !_isProfileMember(recipientId, _sender)) {
                revert UNAUTHORIZED();
            }
        }

        // If the metadata is required and the metadata is invalid this will revert
        if (metadataRequired && (bytes(metadata.pointer).length == 0 || metadata.protocol == 0)) {
            revert INVALID_METADATA();
        }

        // If the recipient address is the zero address this will revert
        if (recipientAddress == address(0)) {
            revert RECIPIENT_ERROR(recipientId);
        }

        // Get the recipient
        Recipient storage recipient = _recipients[recipientId];

        // update the recipients data
        recipient.recipientAddress = recipientAddress;
        recipient.metadata = metadata;
        recipient.useRegistryAnchor = useRegistryAnchor ? true : isUsingRegistryAnchor;

        if (recipientToStatusIndexes[recipientId] == 0) {
            // recipient registering new application
            recipientToStatusIndexes[recipientId] = recipientsCounter;
            _setRecipientStatus(recipientId, uint8(Status.Pending));

            bytes memory extendedData = abi.encode(_data, recipientsCounter);
            emit Registered(recipientId, extendedData, _sender);

            recipientIndexToAddress[recipientsCounter] = recipientId;

            recipientsCounter++;
        } else {
            uint8 currentStatus = _getUintRecipientStatus(recipientId);
            if (currentStatus == uint8(Status.Accepted)) {
                // recipient updating accepted application
                _setRecipientStatus(recipientId, uint8(Status.Pending));
            } else if (currentStatus == uint8(Status.Rejected)) {
                // recipient updating rejected application
                _setRecipientStatus(recipientId, uint8(Status.Appealed));
            }
            emit UpdatedRegistration(recipientId, _data, _sender, _getUintRecipientStatus(recipientId));
        }
    }

    /**
    * @dev Cancel funding round.
    */
    function cancel()
        external
        onlyCoordinator
    {
        if (isFinalized) {
        revert RoundAlreadyFinalized();
        }
        isFinalized = true;
        isCancelled = true;
    }

    /// =========================
    /// ==== View Functions =====
    /// =========================

    /// @notice Get the total number of recipients
    /// @return The total number of recipients
    function getRecipientCount() external view returns (uint256) {
        return recipientsCounter;
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
    function _isAcceptedRecipient(address _recipientId) public view returns (bool) {
        return _getRecipientStatus(_recipientId) == Status.Accepted;
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
    function _getPayout(
        address _recipientId,
        bytes memory data
    ) internal view override returns (PayoutSummary memory _payoutSummary) {}

    /**
     * @dev Get the amount of voice credits for a given address.
     * This function is a part of the InitialVoiceCreditProxy interface.
     * @param _data Encoded address of a user.
     */
    function getVoiceCredits(
        address /* _caller */,
        bytes memory _data
    ) external view returns (uint256) {
        address _allocator = abi.decode(_data, (address));
        if (!_isValidAllocator(_allocator)) {
            return 0;
        }
        return contributorCredits[_allocator];
    }

    function _beforeIncreasePoolAmount(uint256) internal view override {
        // Cannot increase pool amount after the round has been finalized
        // This is to prevent any additional funds from being added to the pool so that Alpha value is calculated correctly
        if (isFinalized) {
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

    /// @notice Validate the distribution for the payout.
    /// @param _index index of the distribution
    /// @return 'true' if the distribution is valid, otherwise 'false'
    function _validateDistribution(
        uint256 _index
    ) internal view returns (bool) {
        // If the '_index' has been distributed this will return 'false'
        if (_hasBeenDistributed(_index)) {
            return false;
        }

        // Return 'true', the distribution is valid at this point
        return true;
    }

    /// @notice Get recipient status
    /// @dev This will return the 'Status' of the recipient, the 'Status' is used at the strategy
    ///      level and is different from the 'Status' which is used at the protocol level
    /// @param _recipientId ID of the recipient
    /// @return Status of the recipient
    function _getRecipientStatus(address _recipientId) internal view override returns (Status) {
        return Status(_getUintRecipientStatus(_recipientId));
    }

    /// @notice Check if the distribution has been distributed.
    /// @param _index index of the distribution
    /// @return 'true' if the distribution has been distributed, otherwise 'false'
    function _hasBeenDistributed(uint256 _index) internal view returns (bool) {
        // Get the word index by dividing the '_index' by 256
        uint256 distributedWordIndex = _index / 256;

        // Get the bit index by getting the remainder of the '_index' divided by 256
        uint256 distributedBitIndex = _index % 256;

        // Get the word from the 'distributedBitMap' using the 'distributedWordIndex'
        uint256 distributedWord = distributedBitMap[distributedWordIndex];

        // Get the mask by shifting 1 to the left of the 'distributedBitIndex'
        uint256 mask = (1 << distributedBitIndex);

        // Return 'true' if the 'distributedWord' and 'mask' are equal to the 'mask'
        return distributedWord & mask == mask;
    }

    /// @notice Mark distribution as done.
    /// @param _index index of the distribution
    function _setDistributed(uint256 _index) internal {
        // Get the word index by dividing the '_index' by 256
        uint256 distributedWordIndex = _index / 256;

        // Get the bit index by getting the remainder of the '_index' divided by 256
        uint256 distributedBitIndex = _index % 256;

        // Set the bit in the 'distributedBitMap' shifting 1 to the left of the 'distributedBitIndex'
        distributedBitMap[distributedWordIndex] |= (1 << distributedBitIndex);
    }

    /// @notice Set the recipient status.
    /// @param _recipientId ID of the recipient
    /// @param _status Status of the recipient
    function _setRecipientStatus(address _recipientId, uint256 _status) internal {
        // Get the row index, column index and current row
        (uint256 rowIndex, uint256 colIndex, uint256 currentRow) = _getStatusRowColumn(_recipientId);

        // Calculate the 'newRow'
        uint256 newRow = currentRow & ~(15 << colIndex);

        // Add the status to the mapping
        statusesBitMap[rowIndex] = newRow | (_status << colIndex);
    }

    /// @notice Get recipient status
    /// @param _recipientId ID of the recipient
    /// @return status The status of the recipient
    function _getUintRecipientStatus(address _recipientId) internal view returns (uint8 status) {
        if (recipientToStatusIndexes[_recipientId] == 0) return 0;
        // Get the column index and current row
        (, uint256 colIndex, uint256 currentRow) = _getStatusRowColumn(_recipientId);

        // Get the status from the 'currentRow' shifting by the 'colIndex'
        status = uint8((currentRow >> colIndex) & 15);

        // Return the status
        return status;
    }

    /// @notice Get recipient status 'rowIndex', 'colIndex' and 'currentRow'.
    /// @param _recipientId ID of the recipient
    /// @return (rowIndex, colIndex, currentRow)
    function _getStatusRowColumn(address _recipientId) internal view returns (uint256, uint256, uint256) {
        uint256 recipientIndex = recipientToStatusIndexes[_recipientId] - 1;

        uint256 rowIndex = recipientIndex / 64; // 256 / 4
        uint256 colIndex = (recipientIndex % 64) * 4;

        return (rowIndex, colIndex, statusesBitMap[rowIndex]);
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
    ) internal view returns (uint256 _alpha) {
        // make sure budget = contributions + matching pool
        uint256 contributions = _totalSpent * voiceCreditFactor;

        if (_budget < contributions) {
            revert InvalidBudget();
        }

        // guard against division by zero.
        // This happens when no project receives more than one vote
        if (_totalVotesSquares <= _totalSpent) {
            revert NoProjectHasMoreThanOneVote();
        }

        return
            ((_budget - contributions) * ALPHA_PRECISION) /
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
    ) internal view returns (uint256) {
        // amount = ( alpha * (quadratic votes)^2 + (precision - alpha) * totalSpent ) / precision
        uint256 quadratic = alpha * voiceCreditFactor * _tallyResult * _tallyResult;
        uint256 totalSpentCredits = voiceCreditFactor * _spent;
        uint256 linearPrecision = ALPHA_PRECISION * totalSpentCredits;
        uint256 linearAlpha = alpha * totalSpentCredits;
        return ((quadratic + linearPrecision) - linearAlpha) / ALPHA_PRECISION;
    }
}
