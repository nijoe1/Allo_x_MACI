// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

// Interfaces
import { IAllo } from "../../../core/interfaces/IAllo.sol";

import { IRegistry } from "../../../core/interfaces/IRegistry.sol";

// Internal Libraries
import { Metadata } from "../../../core/libraries/Metadata.sol";

contract Events_Errors {
    // Errors
    error OnlyMaciCanRegisterVoters();
    error NotCoordinator();
    error InvalidPoll();
    error InvalidTally();
    error InvalidMessageProcessor();
    error MaciAlreadySet();
    error ContributionAmountIsZero();
    error ContributionAmountTooLarge();
    error AlreadyContributed();
    error UserNotVerified();
    error UserHasNotContributed();
    error UserAlreadyRegistered();
    error NoVoiceCredits();
    error NothingToWithdraw();
    error RoundNotCancelled();
    error RoundCancelled();
    error RoundAlreadyFinalized();
    error RoundNotFinalized();
    error VotesNotTallied();
    error EmptyTallyHash();
    error InvalidBudget();
    error NoProjectHasMoreThanOneVote();
    error VoteResultsAlreadyVerified();
    error IncorrectTallyResult();
    error IncorrectSpentVoiceCredits();
    error IncorrectPerVOSpentVoiceCredits();
    error FundsAlreadyClaimed();
    error TallyHashNotPublished();
    error IncompleteTallyResults(uint256 total, uint256 actual);
    error NoVotes();
    error MaciNotSet();
    error PollNotSet();
    error InvalidMaci();
    error InvalidNativeToken();
    error InvalidUserRegistry();
    error InvalidRecipientRegistry();
    error InvalidCoordinator();
    error UnexpectedPollAddress(address expected, address actual);

    // MACI Events
    event Contribution(address indexed _sender, uint256 _amount);
    event ContributionWithdrawn(address indexed _contributor);
    event FundsClaimed(uint256 indexed _voteOptionIndex, address indexed _recipient, uint256 _amount);
    event TallyPublished(string _tallyHash);
    event Voted(address indexed _contributor);
    event TallyResultsAdded(uint256 indexed _voteOptionIndex, uint256 _tally);
    event PollSet(address indexed _poll);
    event TallySet(address indexed _tally);

    /// ======================
    /// ======= Events =======
    /// ======================

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

    /// @notice Emitted when a recipient receives votes
    /// @param recipientId ID of the recipient
    /// @param votes The votes allocated to the recipient
    /// @param allocator The allocator assigning the votes
    event Allocated(address indexed recipientId, uint256 votes, address allocator);

    /// @notice Emitted when an allocator is added
    /// @param allocator The allocator address
    /// @param sender The sender of the transaction
    event AllocatorAdded(address indexed allocator, address sender);

    /// @notice Emitted when an allocator is removed
    /// @param allocator The allocator address
    /// @param sender The sender of the transaction
    event AllocatorRemoved(address indexed allocator, address sender);


    // MACI Event
    /// @notice Emitted when a MACI contract is set
    /// @param maci The MACI contract address
    /// @param poll The poll contract address
    /// @param messageProcessor The message processor contract address
    /// @param tally The tally contract address
    /// @param subsidy The subsidy contract address
    event MaciSet(address maci, address poll, address messageProcessor, address tally, address subsidy);
}
