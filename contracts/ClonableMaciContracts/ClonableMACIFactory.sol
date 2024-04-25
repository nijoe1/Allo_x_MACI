// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ClonableMACI } from "./ClonableMACI.sol";
import {AccQueueQuinaryMaci} from "maci-contracts/contracts/trees/AccQueueQuinaryMaci.sol";
import { ClonablePoll } from "./ClonablePoll.sol";
import { ClonableTally } from "./ClonableTally.sol";
import { ClonableMessageProcessor } from "./ClonableMessageProcessor.sol";

import { Params } from "maci-contracts/contracts/utilities/Params.sol";
import { AccQueue } from "maci-contracts/contracts/trees/AccQueue.sol";
import { IMACI } from "maci-contracts/contracts/interfaces/IMACI.sol";
import { TopupCredit } from "maci-contracts/contracts/TopupCredit.sol";
import { DomainObjs } from "maci-contracts/contracts/utilities/DomainObjs.sol";

contract ClonableMACIFactory is OwnableUpgradeable {
    uint8 internal constant STATE_TREE_SUBDEPTH = 2;

    uint256 public constant TREE_ARITY = 5;

    uint8 public stateTreeDepth;

    Params.TreeDepths public treeDepths;

    address public verifier;

    address public vkRegistry;

    // The clonable strategy to use for the pools
    address internal clonableMaciImplementation;

    address internal PollImplementation;

    address internal TallyImplementation;

    address internal MessageProcessorImplementation;

    uint256 deployNonce;

    /// @notice constructor function which ensure deployer is set as owner
    function initialize(
        uint8 _stateTreeDepth,
        Params.TreeDepths memory _treeDepths,
        address _verifier,
        address _vkRegistry,
        address _clonableMaciImplementation,
        address _PollImplementation,
        address _TallyImplementation,
        address _MessageProcessorImplementation
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();

        stateTreeDepth = _stateTreeDepth;
        treeDepths = _treeDepths;
        verifier = _verifier;
        vkRegistry = _vkRegistry;
        clonableMaciImplementation = _clonableMaciImplementation;
        PollImplementation = _PollImplementation;
        TallyImplementation = _TallyImplementation;
        MessageProcessorImplementation = _MessageProcessorImplementation;
    }

    function createMACI(
        address _signUpGatekeeper,
        address _initialVoiceCreditProxy,
        address _topupCredit,
        address _coordinator
    ) external returns (address _cloneMaci) {
        _cloneMaci = ClonesUpgradeable.cloneDeterministic(clonableMaciImplementation, bytes32(deployNonce++));

        ClonableMACI(_cloneMaci).initialize(
            address(this),
            stateTreeDepth,
            treeDepths,
            verifier,
            vkRegistry,
            _signUpGatekeeper,
            _initialVoiceCreditProxy,
            _topupCredit,
            _coordinator
        );

        ClonableMACI(_cloneMaci).transferOwnership(msg.sender);
    }

    /// @notice Deploy a new Poll contract and AccQueue contract for messages.
    /// @param _duration The duration of the poll
    /// @param _maxValues The max values for the poll
    /// @param _treeDepths The depths of the merkle trees
    /// @param _coordinatorPubKey The coordinator's public key
    /// @param _maci The MACI contract interface reference
    /// @param _topupCredit The TopupCredit contract
    /// @param _pollOwner The owner of the poll
    /// @return pollAddr deployed Poll contract
    function deployPoll(
        uint256 _duration,
        Params.MaxValues memory _maxValues,
        Params.TreeDepths memory _treeDepths,
        DomainObjs.PubKey memory _coordinatorPubKey,
        address _maci,
        TopupCredit _topupCredit,
        address _pollOwner
    ) public virtual returns (address pollAddr) {
        /// @notice Validate _maxValues
        /// maxVoteOptions must be less than 2 ** 50 due to circuit limitations;
        /// it will be packed as a 50-bit value along with other values as one
        /// of the inputs (aka packedVal)
        if (_maxValues.maxVoteOptions >= (2 ** 50)) {
            revert("InvalidMaxValues");
        }

        AccQueue messageAq = AccQueue(address(0));

        /// @notice the smart contracts that a Poll would interact with
        Params.ExtContracts memory extContracts = Params.ExtContracts({
            maci: IMACI(_maci),
            messageAq: messageAq,
            topupCredit: _topupCredit
        });

        address poll = ClonesUpgradeable.cloneDeterministic(PollImplementation, bytes32(deployNonce++));

        ClonablePoll _poll = ClonablePoll(poll);

        _poll.initialize(_duration, _maxValues, _treeDepths, _coordinatorPubKey, extContracts);

        // init Poll
        _poll.init();

        _poll.transferOwnership(_pollOwner);

        pollAddr = address(poll);
    }

    function deployTally(
        address _verifier,
        address _vkRegistry,
        address _poll,
        address _messageProcessor,
        address _owner
    ) public returns (address tallyAddr) {
        // deploy Tally for this Poll
        address tally = ClonesUpgradeable.cloneDeterministic(TallyImplementation, bytes32(deployNonce++));

        ClonableTally _tally = ClonableTally(tally);

        _tally.initialize(_verifier, _vkRegistry, _poll, _messageProcessor);

        _tally.transferOwnership(_owner);

        tallyAddr = address(tally);
    }

    function deployMessageProcessor(
        address _verifier,
        address _vkRegistry,
        address _poll,
        address _owner
    ) public returns (address messageProcessorAddr) {
        // deploy MessageProcessor for this Poll
        address messageProcessor = ClonesUpgradeable.cloneDeterministic(
            MessageProcessorImplementation,
            bytes32(deployNonce++)
        );

        ClonableMessageProcessor _messageProcessor = ClonableMessageProcessor(messageProcessor);

        _messageProcessor.initialize(_verifier, _vkRegistry, _poll);

        _messageProcessor.transferOwnership(_owner);

        messageProcessorAddr = address(messageProcessor);
    }
}
