pragma solidity ^0.4.23;

import "./ListLib.sol";

contract ListLibTests {

    using ListLib for ListLib.AddressList;

    ListLib.AddressList addressList;

    /* These tests are not exhaustive. It may be worth the effort of finding an audited list and implement that instead */

    function testAddressList () public {
        // add test values
        assert(addressList.add(address(0x0)));
        assert(addressList.add(address(0x1)));
        assert(addressList.add(address(0x2)));
        assert(addressList.add(address(0x3)));
        assert(addressList.getLength() == 4);

        // attempt to add an existing value
        assert(!addressList.add(address(0x3)));
        assert(addressList.getLength() == 4);

        // attempt to remove a non existing value
        assert(!addressList.remove(address(0x4)));
        assert(addressList.getLength() == 4);

        // check expected order in array
        assert(addressList.array[0] == address(0x0));
        assert(addressList.array[1] == address(0x1));
        assert(addressList.array[2] == address(0x2));
        assert(addressList.array[3] == address(0x3));

        // remove head
        assert(addressList.remove(address(0x0)));
        assert(addressList.getLength() == 3);

        // check expected order in array
        assert(addressList.array[0] == address(0x3));
        assert(addressList.array[1] == address(0x1));
        assert(addressList.array[2] == address(0x2));

        // remove body
        assert(addressList.remove(address(0x1)));
        assert(addressList.getLength() == 2);

        // check expected order in array
        assert(addressList.array[0] == address(0x3));
        assert(addressList.array[1] == address(0x2));

        // remove tail
        assert(addressList.remove(address(0x2)));
        assert(addressList.getLength() == 1);

        // check expected order in array
        assert(addressList.array[0] == address(0x3));

        // remove last
        assert(addressList.remove(address(0x3)));
        assert(addressList.getLength() == 0);
    }

}