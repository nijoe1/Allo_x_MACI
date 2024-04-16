//// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title RegistryIndexer
interface IRegistryIndexer {
    function RegisterProfile(address profileID, uint256 poolID, string memory metadata) external;

    function InsertReviews(
        uint256 poolID,
        address reviewedBy,
        uint8[] memory status,
        address[] memory recipientIDs
    ) external;

    function InsertAllocation(uint256 poolID, uint256 votesAmount, address recipientID) external;

    function InsertDistributions(
        uint256 poolID,
        uint256[] memory distributionAmount,
        address[] memory recipientIDs
    ) external;

    function addMaciContracts(
        uint256 poolID,
        address maci,
        address pollID,
        address tallyID,
        address messageProcessorID,
        address subsidyID
    ) external;

    function isVerifiedUser(address _user) external view returns (bool);
}
