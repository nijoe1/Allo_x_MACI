// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.20;

// MACI Contracts & Libraries
import { ClonableMACIFactory } from "../../ClonableMaciContracts/ClonableMACIFactory.sol";

import { DomainObjs } from "maci-contracts/contracts/utilities/DomainObjs.sol";

import { ClonableMACI } from "../../ClonableMaciContracts/ClonableMACI.sol";

import { Params } from "maci-contracts/contracts/utilities/Params.sol";

import { Tally } from "maci-contracts/contracts/Tally.sol";

import { Poll } from "maci-contracts/contracts/Poll.sol";

// Core Contracts
import { QVMACIBase } from "./QVMACIBase.sol";

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

contract QVMACI is QVMACIBase, DomainObjs, Params {
    /// ======================
    /// ======= Storage ======
    /// ======================

    address public maciFactory;

    address public _maci;

    ClonableMACI.PollContracts public _pollContracts;

    address public coordinator; // coordinator address

    PubKey public coordinatorPubKey; // coordinator public key

    string public tallyHash;

    uint256 public totalTallyResults;

    struct MaciParams {
        address coordinator;
        PubKey coordinatorPubKey;
        address maciFactory;
    }

    struct InitializeParamsMACI {
        InitializeParams initializeParams;
        MaciParams maciParams;
    }

    struct VoteParams {
        Message[] messages;
        PubKey[] pubKeys;
    }

    /// ================================
    /// ========== Modifier ============
    /// ================================

    modifier onlyCoordinator() {
        if (msg.sender != coordinator) {
            revert NotCoordinator();
        }
        _;
    }

    /// ====================================
    /// ========== Constructor =============
    /// ====================================

    constructor(address _allo, string memory _name, address _maciFactory) QVMACIBase(_allo, _name) {
        maciFactory = _maciFactory;
    }

    /// ====================================
    /// =========== Initialize =============
    /// ====================================

    /// @notice Initialize the strategy
    /// @param _poolId The ID of the pool
    /// @param _data The initialization data for the strategy
    /// @custom:data (InitializeParamsSimple)
    function initialize(uint256 _poolId, bytes memory _data) external virtual override onlyAllo {
        InitializeParamsMACI memory _initializeParams = abi.decode(_data, (InitializeParamsMACI));

        __QVMACIStrategy_init(_poolId, _initializeParams);

        emit Initialized(_poolId, _data);
    }

    /// @notice Internal initialize function
    /// @param _poolId The ID of the pool
    /// @param _params The initialize params for the strategy
    function __QVMACIStrategy_init(uint256 _poolId, InitializeParamsMACI memory _params) internal {
        __QVBaseStrategy_init(_poolId, _params.initializeParams);

        address strategy = address(allo.getPool(_poolId).strategy);

        coordinator = _params.maciParams.coordinator;

        coordinatorPubKey = _params.maciParams.coordinatorPubKey;

        _maci = ClonableMACIFactory(_params.maciParams.maciFactory).createMACI(
            strategy,
            strategy,
            address(0),
            coordinator
        );

        uint256 _pollDuration = _params.initializeParams.allocationEndTime - block.timestamp;

        _pollContracts = ClonableMACI(_maci).deployPoll(_pollDuration, _params.maciParams.coordinatorPubKey);

        emit MaciSet(
            _maci,
            _pollContracts.poll,
            _pollContracts.messageProcessor,
            _pollContracts.tally,
            _pollContracts.subsidy
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
        if (isAddressZero(_maci)) revert MaciNotSet();
        if (isFinalized) revert RoundAlreadyFinalized();

        bytes memory signUpGatekeeperData = abi.encode(msg.sender, maxVoiceCreditsPerAllocator);
        bytes memory initialVoiceCreditProxyData = abi.encode(msg.sender);

        ClonableMACI(_maci).signUp(pubKey, signUpGatekeeperData, initialVoiceCreditProxyData);
    }

    /**
     * @dev Register user for voting.
     * This function is part of SignUpGatekeeper interface.
     * @param _data Encoded address of a contributor.
     */
    function register(address /* _caller */, bytes memory _data) public view {
        if (msg.sender != _maci) {
            revert OnlyMaciCanRegisterVoters();
        }

        address user = abi.decode(_data, (address));
        bool verified = _isValidAllocator(user);

        if (!verified) {
            revert UserNotVerified();
        }
    }

    /**
     * @dev Publish the IPFS hash of the vote tally. Only coordinator can publish.
     * @param _tallyHash IPFS hash of the vote tally.
     */
    function publishTallyHash(string calldata _tallyHash) external onlyCoordinator onlyAfterAllocation {
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
    ) external onlyPoolManager(msg.sender) onlyAfterAllocation {
        (, Tally tally) = getMaciContracts();

        if (isFinalized) {
            revert RoundAlreadyFinalized();
        }

        if (isAddressZero(_maci)) revert MaciNotSet();

        if (!tally.isTallied()) {
            revert VotesNotTallied();
        }
        if (bytes(tallyHash).length == 0) {
            revert TallyHashNotPublished();
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
    ) public {
        (Poll poll, Tally tally) = getMaciContracts();

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

        _tallyRecipientVotes(_voteOptionIndex, _tallyResult);

        totalTallyResults++;

        emit TallyResultsAdded(_voteOptionIndex, _tallyResult);
    }

    /**
        * @dev Add and verify tally results by batch.
        * @param _voteOptionIndices Vote option index.
        * @param _tallyResults The results of vote tally for the recipients.
        * @param _tallyResultProofs Proofs of correctness of the vote tally results.
        * @param _tallyResultSalt the respective salt in the results object in the tally.json
        * @param _spentVoiceCreditsHashes hashLeftRight(number of spent voice credits, spent salt)
        * @param _perVOSpentVoiceCreditsHashes hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
    */
    function addTallyResultsBatch(
        uint256[] calldata _voteOptionIndices,
        uint256[] calldata _tallyResults,
        uint256[][][] calldata _tallyResultProofs,
        uint256 _tallyResultSalt,
        uint256 _spentVoiceCreditsHashes,
        uint256 _perVOSpentVoiceCreditsHashes
    ) external onlyCoordinator {
        if (_voteOptionIndices.length != _tallyResults.length) {
            revert INVALID();
        }

        for (uint256 i = 0; i < _voteOptionIndices.length; i++) {
            _addTallyResult(
                _voteOptionIndices[i],
                _tallyResults[i],
                _tallyResultProofs[i],
                _tallyResultSalt,
                _spentVoiceCreditsHashes,
                _perVOSpentVoiceCreditsHashes
            );
        }
    }
    

    /// =========================
    /// ==== View Functions =====
    /// =========================

    function isAddressZero(address _address) internal pure returns (bool) {
        return _address == address(0);
    }

    // @notice get Poll and Tally contracts
    // @return Poll and Tally contracts
    function getMaciContracts() internal view returns (Poll _poll, Tally _tally) {
        return (Poll(_pollContracts.poll), Tally(_pollContracts.tally));
    }

    /// @notice Allocate votes to a recipient
    /// @param _data The data
    /// @param _sender The sender of the transaction
    /// @dev Only the pool manager(s) can call this function
    function _allocate(bytes memory _data, address _sender) internal override {
        (Poll poll, ) = getMaciContracts();

        VoteParams memory voteParams = abi.decode(_data, (VoteParams));

        if (voteParams.messages.length != voteParams.pubKeys.length) {
            revert INVALID();
        }

        // TODO - If we allow donation through the allocation, we need to update the function to handle it and return before the Private allocation starts

        poll.publishMessageBatch(voteParams.messages, voteParams.pubKeys);

        emit Allocated(address(0), voteParams.messages.length, _sender);
    }

    /// @notice _tallyRecipientVotes votes to a recipient
    /// @param _voteOptionIndex The vote option index
    /// @param _voiceCreditsToAllocate The voice credits to allocate
    /// @dev Only the pool manager(s) can call this function
    function _tallyRecipientVotes(uint256 _voteOptionIndex, uint256 _voiceCreditsToAllocate) internal {
        address recipientId = recipientIndexToAddress[_voteOptionIndex];

        // spin up the structs in storage for updating
        Recipient storage recipient = recipients[recipientId];

        if (recipient.tallyVerified) {
            revert VoteResultsAlreadyVerified();
        }

        recipient.tallyVerified = true;

        // check that the recipient is accepted
        if (!_isAcceptedRecipient(recipientId)) revert RECIPIENT_ERROR(recipientId);

        // check the `_voiceCreditsToAllocate` is > 0
        if (_voiceCreditsToAllocate == 0) revert INVALID();

        // determine actual votes cast
        uint256 voteResult = _sqrt(_voiceCreditsToAllocate * 1e18);

        // update the values
        totalRecipientVotes += voteResult;

        recipient.totalVotesReceived = voteResult;

        // emit the event with the vote results
        emit Allocated(recipientId, voteResult, coordinator);
    }
}
