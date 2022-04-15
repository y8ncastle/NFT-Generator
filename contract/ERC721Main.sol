// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC721/ERC721.sol)

pragma solidity ^0.8.0;

import "./extensions/ERC721URIStorage.sol";
import "./utils/Context.sol";

/**
 * @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, including
 * the Metadata extension, but not including the Enumerable extension, which is available separately as
 * {ERC721Enumerable}.
 */
contract ERC721Main is ERC721URIStorage {
    uint256 private _tokenId;

    constructor() public ERC721("BaSE NFT", "NFT") {
    }

    function _increment() private {
        _tokenId += 1;
    }

    function current() public view returns (uint256) {
        return _tokenId;
    }

    function genNew(string memory _tokenURI, address to) public returns (uint256) {
        _increment();
        uint256 newTokenId = current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        _transfer(msg.sender, to, newTokenId);
        
        return newTokenId;
    }
}