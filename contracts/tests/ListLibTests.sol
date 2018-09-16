pragma solidity ^0.4.23;

import "../libraries/ListLib.sol";

/* These tests are not exhaustive. It may be worth the effort of finding an audited linked list and implement that instead */

contract ListLibTests {

    using ListLib for ListLib.AddressList;
    using ListLib for ListLib.Bytes32List;
    using ListLib for ListLib.UintList;

    ListLib.AddressList addressList;
    ListLib.Bytes32List bytes32List;
    ListLib.UintList uintList;

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

    function testBytes32List () public {
        // add test values
        assert(bytes32List.add('0'));
        assert(bytes32List.add('1'));
        assert(bytes32List.add('2'));
        assert(bytes32List.add('3'));
        assert(bytes32List.getLength() == 4);
    /*
        // attempt to add an existing value
        assert(!bytes32List.add('3'));
        assert(bytes32List.getLength() == 4);

        // attempt to remove a non existing value
        assert(!bytes32List.remove('4'));
        assert(bytes32List.getLength() == 4);

        // check expected order in array
        assert(bytes32List.array[0] == '0');
        assert(bytes32List.array[1] == '1');
        assert(bytes32List.array[2] == '2');
        assert(bytes32List.array[3] == '3');

        // remove head
        assert(bytes32List.remove('0'));
        assert(bytes32List.getLength() == 3);

        // check expected order in array
        assert(bytes32List.array[0] == '3');
        assert(bytes32List.array[1] == '1');
        assert(bytes32List.array[2] == '2');

        // remove body
        assert(bytes32List.remove('1'));
        assert(bytes32List.getLength() == 2);

        // check expected order in array
        assert(bytes32List.array[0] == '3');
        assert(bytes32List.array[1] == '2');

        // remove tail
        assert(bytes32List.remove('2'));
        assert(bytes32List.getLength() == 1);

        // check expected order in array
        assert(bytes32List.array[0] == '3');

        // remove last
        assert(bytes32List.remove('3'));
        assert(bytes32List.getLength() == 0);
    */
    }

    function testUintList () public {
        // add test values
        assert(uintList.add(0));
        assert(uintList.add(1));
        assert(uintList.add(2));
        assert(uintList.add(3));
        assert(uintList.getLength() == 4);
    /*
        // attempt to add an existing value
        assert(!uintList.add(3));
        assert(uintList.getLength() == 4);

        // attempt to remove a non existing value
        assert(!uintList.remove(4));
        assert(uintList.getLength() == 4);

        // check expected order in array
        assert(uintList.array[0] == 0);
        assert(uintList.array[1] == 1);
        assert(uintList.array[2] == 2);
        assert(uintList.array[3] == 3);

        // remove head
        assert(uintList.remove(0));
        assert(uintList.getLength() == 3);

        // check expected order in array
        assert(uintList.array[0] == 3);
        assert(uintList.array[1] == 1);
        assert(uintList.array[2] == 2);

        // remove body
        assert(uintList.remove(1));
        assert(uintList.getLength() == 2);

        // check expected order in array
        assert(uintList.array[0] == 3);
        assert(uintList.array[1] == 2);

        // remove tail
        assert(uintList.remove(2));
        assert(uintList.getLength() == 1);

        // check expected order in array
        assert(uintList.array[0] == 3);

        // remove last
        assert(uintList.remove(3));
        assert(uintList.getLength() == 0);
    */
    }

}