// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

// MACI Contracts & Libraries
import { ClonableMACIFactory } from "../../ClonableMaciContracts/ClonableMACIFactory.sol";

import { DomainObjs } from "maci-contracts/contracts/utilities/DomainObjs.sol";

import { ClonableMACI } from "../../ClonableMaciContracts/ClonableMACI.sol";

import { Params } from "maci-contracts/contracts/utilities/Params.sol";

import { Tally } from "maci-contracts/contracts/Tally.sol";

import { Poll } from "maci-contracts/contracts/Poll.sol";

// Core Contracts
import { IAllo, IERC20 } from "./interfaces/Constants.sol";

import { QFMACIBase } from "./QFMACIBase.sol";

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

contract QFMACI is QFMACIBase, DomainObjs, Params {

    /// ======================
    /// ======= Structs ======
    /// ======================

    struct MaciParams {
        address coordinator;
        PubKey coordinatorPubKey;
        address maciFactory;
        uint8 maciId;
    }

    struct InitializeParamsMACI {
        InitializeParams initializeParams;
        MaciParams maciParams;
    }

    struct claimFunds {
        uint256 voteOptionIndex;
        uint256 spent;
        uint256[][] spentProof;
        uint256 spentSalt;
        uint256 resultsCommitment;
        uint256 spentVoiceCreditsCommitment;
    }

    /// ======================
    /// ======= Storage ======
    /// ======================

    ClonableMACI.PollContracts public _pollContracts;

    PubKey public coordinatorPubKey; // coordinator public key

    address public coordinator; // coordinator address

    address public maciFactory;

    string public tallyHash;

    address public _maci;

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

    constructor(address _allo, string memory _name, address _maciFactory) QFMACIBase(_allo, _name) {
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

        __QFMACIStrategy_init(_poolId, _initializeParams);

        emit Initialized(_poolId, _data);
    }

    /// @notice Internal initialize function
    /// @param _poolId The ID of the pool
    /// @param _params The initialize params for the strategy
    function __QFMACIStrategy_init(uint256 _poolId, InitializeParamsMACI memory _params) internal {
        __QVBaseStrategy_init(_poolId, _params.initializeParams);

        address strategy = address(allo.getPool(_poolId).strategy);

        coordinator = _params.maciParams.coordinator;

        coordinatorPubKey = _params.maciParams.coordinatorPubKey;

        _maci = ClonableMACIFactory(_params.maciParams.maciFactory).createMACI(
            strategy,
            strategy,
            address(0),
            coordinator,
            _params.maciParams.maciId
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
     * @dev Register user for voting.
     * This function is part of SignUpGatekeeper interface.
     * @param _data Encoded address of a contributor.
     */
    function register(address /* _caller */, bytes memory _data) external view {
        if (msg.sender != _maci) {
            revert OnlyMaciCanRegisterVoters();
        }

        address user = abi.decode(_data, (address));

        bool verified = contributorCredits[user] > 0;

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

        // Total amount of spent voice credits is the size of the pool of direct rewards.
        // Everything else, including unspent voice credits and downscaling error,
        // is considered a part of the matching pool
        alpha = calcAlpha(poolAmount, totalVotesSquares, _totalSpent);

        isFinalized = true;
    }

    /// ====================================
    /// ============ Internal ==============
    /// ====================================

    /// @notice Allocate votes to a recipient
    /// @param _data The data
    /// @param _sender The sender of the transaction
    /// @dev Only the pool manager(s) can call this function
    function _allocate(bytes memory _data, address _sender) internal override {

        (PubKey memory pubKey, uint256 amount) = abi.decode(_data, (PubKey, uint256));

        if (isAddressZero(_maci)) revert MaciNotSet();

        if (isFinalized) revert RoundAlreadyFinalized();

        address token = allo.getPool(poolId).token;

        if(token != NATIVE) {
            IERC20(token).transferFrom(_sender, address(this), amount);
        }else{
            if (msg.value != amount) revert InvalidAmount();
        }

        if (contributorCredits[_sender] != 0) revert AlreadyContributed();

        if (amount > MAX_VOICE_CREDITS * voiceCreditFactor) revert ContributionAmountTooLarge();

        uint256 voiceCredits = amount / voiceCreditFactor;

        contributorCredits[_sender] = voiceCredits;

        poolAmount += amount;

        bytes memory signUpGatekeeperData = abi.encode(_sender, voiceCredits);
        bytes memory initialVoiceCreditProxyData = abi.encode(_sender);

        ClonableMACI(_maci).signUp(pubKey, signUpGatekeeperData, initialVoiceCreditProxyData);

        emit Allocated(address(0), amount, token, _sender);
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
    ) internal {

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

        totalRecipientVotes += _tallyResult;

        totalVotesSquares = totalVotesSquares + (_tallyResult * _tallyResult);

        _tallyRecipientVotes(_voteOptionIndex, _tallyResult);

        emit TallyResultsAdded(_voteOptionIndex, _tallyResult);
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
            return;
        }

        recipient.tallyVerified = true;

        // check that the recipient is accepted
        if (!_isAcceptedRecipient(recipientId))  return;

        // check the `_voiceCreditsToAllocate` is > 0
        if (_voiceCreditsToAllocate == 0)  return;

        recipient.totalVotesReceived = _voiceCreditsToAllocate;

        // emit the event with the vote results
        emit TallyResultsAdded(_voteOptionIndex, _voiceCreditsToAllocate);
    }


    // TODO are we going to allow anyone to distribute the funds? or only the pool manager?
    /// @notice Distribute the tokens to the recipients
    /// @dev The "_sender" must be a pool manager and the allocation must have ended
    function _distribute(
        address[] memory /* _recipientIds */,
        bytes memory data,
        address /* _sender */
    ) internal override onlyAfterAllocation {

        if(!isFinalized) {
            revert INVALID();
        }

        (bytes[] memory claims) = abi.decode(data, (bytes[]));

        for (uint256 i = 0; i < claims.length; i++) {
            _distributeFunds(claims[i]);
        }        

        if (!distributionStarted) {
            distributionStarted = true;
        }
    }

    /// @notice Distribute the funds to the recipients
    /// @param _claim The claim funds
    function _distributeFunds(bytes memory _claim) internal {

        (claimFunds memory claim) = abi.decode(_claim, (claimFunds));

        address recipientId = recipientIndexToAddress[claim.voteOptionIndex];

        Recipient memory recipient = recipients[recipientId];
            
        uint256 amount = getAllocatedAmount(recipient.totalVotesReceived, claim.spent);

        verifyClaim(claim);
            
        if (paidOut[recipientId] || !_isAcceptedRecipient(recipientId) || amount == 0) {
            revert RECIPIENT_ERROR(recipientId);
        }

        IAllo.Pool memory pool = allo.getPool(poolId);

        _transferAmount(pool.token, recipientId, amount);

        paidOut[recipientId] = true;

        emit Distributed(recipientId, recipient.recipientAddress, amount, address(0));
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

    /**
        * @dev Claim allocated tokens.
        * @param __claimFunds Vote option index.
    */
    function verifyClaim(
        claimFunds memory __claimFunds
    )internal view {
        
        (Poll poll, Tally tally) = getMaciContracts();
        
        (, , , uint8 voteOptionTreeDepth) = poll.treeDepths();

        bool verified = tally.verifyPerVOSpentVoiceCredits(
            __claimFunds.voteOptionIndex,
            __claimFunds.spent,
            __claimFunds.spentProof,
            __claimFunds.spentSalt,
            voteOptionTreeDepth,
            __claimFunds.spentVoiceCreditsCommitment,
            __claimFunds.resultsCommitment
        );

        if (!verified) {
            revert IncorrectPerVOSpentVoiceCredits();
        }
    }
}
