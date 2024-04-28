// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

// Interfaces
import { IAllo } from "../../../core/interfaces/IAllo.sol";

import { IRegistry } from "../../../core/interfaces/IRegistry.sol";

// Interfaces
import { IStrategy } from "../../../core/interfaces/IStrategy.sol";

// Internal Libraries
import { Metadata } from "../../../core/libraries/Metadata.sol";

// External Libraries
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Constants {

    uint256 public constant TREE_ARITY = 5;

    /// ======================
    /// ======= Errors ======
    /// ======================
    error NotCoordinator();
    error MaciNotSet();
    error RoundAlreadyFinalized();
    error VotesNotTallied();
    error TallyHashNotPublished();
    error IncompleteTallyResults(uint256 total, uint256 actual);
    error NoVotes();
    error OnlyMaciCanRegisterVoters();
    error UserNotVerified();
    error EmptyTallyHash();
    error IncorrectSpentVoiceCredits();
    error IncorrectTallyResult();
    error IncorrectPerVOSpentVoiceCredits();
    error VoteResultsAlreadyVerified();
    error InvalidAmount();
    error AlreadyContributed();
    error ContributionAmountTooLarge();

    /// ======================
    /// ======= Events ======
    /// ======================

    /// @notice Emitted when a recipient is registered
    /// @param recipientId ID of the recipient
    /// @param applicationId ID of the recipient"s application
    /// @param status The status of the recipient
    /// @param sender The sender of the transaction
    event RecipientStatusUpdated(
        address indexed recipientId,
        uint256 applicationId,
        IStrategy.Status status,
        address sender
    );

    /// @notice Emitted when a recipient is reviewed
    /// @param recipientId ID of the recipient
    /// @param applicationId ID of the recipient"s application
    /// @param status The status of the recipient
    /// @param sender The sender of the transaction
    event Reviewed(address indexed recipientId, uint256 applicationId, IStrategy.Status status, address sender);

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
        IStrategy.Status status
    );

    /// @notice Emitted when the MACI contract is set
    /// @param maci The MACI contract address
    /// @param poll The poll contract address
    /// @param messageProcessor The message processor contract address
    /// @param tally The tally contract address
    /// @param subsidy The subsidy contract address
    event MaciSet(address maci, address poll, address messageProcessor, address tally, address subsidy);

    /// @notice Emitted when a recipient is added
    /// @param recipientId ID of the recipient
    /// @param recipientIndex ID of the recipient"s MACI voting option
    event RecipientVotingOptionAdded(address recipientId, uint256 recipientIndex);

    /// @notice Emitted when the tally hash is published
    /// @param tallyHash The IPFS hash of the tally
    event TallyPublished(string tallyHash);

    event TallyResultsAdded(uint256 indexed voteOptionIndex, uint256 tally);

    /// @notice Emitted when the pool timestamps are updated
    /// @param registrationStartTime The start time for the registration
    /// @param registrationEndTime The end time for the registration
    /// @param allocationStartTime The start time for the allocation
    /// @param allocationEndTime The end time for the allocation
    /// @param sender The sender of the transaction
    event TimestampsUpdated(
        uint64 registrationStartTime,
        uint64 registrationEndTime,
        uint64 allocationStartTime,
        uint64 allocationEndTime,
        address sender
    );
}
