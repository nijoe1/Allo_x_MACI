// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

/*
 * These imports are just for hardhat to find the contracts for deployment
 * They are not used anywhere else
 */
import { Poll } from "maci-contracts/contracts/Poll.sol";
import { PollFactory } from "maci-contracts/contracts/PollFactory.sol";
import { TallyFactory } from "maci-contracts/contracts/TallyFactory.sol";
import { SubsidyFactory } from "maci-contracts/contracts/SubsidyFactory.sol";
import { MessageProcessorFactory } from "maci-contracts/contracts/MessageProcessorFactory.sol";
import { PoseidonT3 } from "maci-contracts/contracts/crypto/PoseidonT3.sol";
import { PoseidonT4 } from "maci-contracts/contracts/crypto/PoseidonT4.sol";
import { PoseidonT5 } from "maci-contracts/contracts/crypto/PoseidonT5.sol";
import { PoseidonT6 } from "maci-contracts/contracts/crypto/PoseidonT6.sol";
