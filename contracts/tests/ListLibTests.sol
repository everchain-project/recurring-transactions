pragma solidity ^0.4.23;

import "../ListLib.sol";

contract ListLibTests {

    using ListLib for ListLib.AddressList;
    using ListLib for ListLib.Bytes32List;
    using ListLib for ListLib.UintList;

    ListLib.AddressList addressList;
    ListLib.Bytes32List bytes32List;
    ListLib.UintList uintList;

    function testAddressList () public {
        // test 1: remove head first
        assert(addressList.add(address(0x0)));
        assert(addressList.add(address(0x1)));
        assert(addressList.add(address(0x2)));
        assert(addressList.array.length == 3);
        
        assert(addressList.array[0] == address(0x0));
        assert(addressList.array[1] == address(0x1));
        assert(addressList.array[2] == address(0x2));
        
        assert(addressList.contains(address(0x0)));
        assert(addressList.contains(address(0x1)));
        assert(addressList.contains(address(0x2)));

        assert(addressList.remove(address(0x0)));
        assert(addressList.remove(address(0x1)));
        assert(addressList.remove(address(0x2)));

        assert(!addressList.contains(address(0x0)));
        assert(!addressList.contains(address(0x1)));
        assert(!addressList.contains(address(0x2)));
        assert(addressList.array.length == 0);

        // test 2: remove tail first
        assert(addressList.add(address(0x0)));
        assert(addressList.add(address(0x1)));
        assert(addressList.add(address(0x2)));

        assert(addressList.remove(address(0x2)));
        assert(addressList.remove(address(0x1)));
        assert(addressList.remove(address(0x0)));

        assert(!addressList.contains(address(0x0)));
        assert(!addressList.contains(address(0x1)));
        assert(!addressList.contains(address(0x2)));
        assert(addressList.array.length == 0);

        // test 3: remove body first
        assert(addressList.add(address(0x0)));
        assert(addressList.add(address(0x1)));
        assert(addressList.add(address(0x2)));

        assert(addressList.remove(address(0x1)));
        assert(addressList.remove(address(0x2)));
        assert(addressList.remove(address(0x0)));

        assert(!addressList.contains(address(0x0)));
        assert(!addressList.contains(address(0x1)));
        assert(!addressList.contains(address(0x2)));
        assert(addressList.array.length == 0);
    }
    
    function testBytes32List () public {
        // test 1: remove head first
        assert(bytes32List.add('a'));
        assert(bytes32List.add('b'));
        assert(bytes32List.add('c'));
        assert(bytes32List.array.length == 3);
        
        assert(bytes32List.array[0] == 'a');
        assert(bytes32List.array[1] == 'b');
        assert(bytes32List.array[2] == 'c');
        
        assert(bytes32List.contains('a'));
        assert(bytes32List.contains('b'));
        assert(bytes32List.contains('c'));

        assert(bytes32List.remove('a'));
        assert(bytes32List.remove('b'));
        assert(bytes32List.remove('c'));

        assert(!bytes32List.contains('a'));
        assert(!bytes32List.contains('b'));
        assert(!bytes32List.contains('c'));
        assert(bytes32List.array.length == 0);

        // test 2: remove tail first
        assert(bytes32List.add('a'));
        assert(bytes32List.add('b'));
        assert(bytes32List.add('c'));

        assert(bytes32List.remove('c'));
        assert(bytes32List.remove('b'));
        assert(bytes32List.remove('a'));

        assert(!bytes32List.contains('a'));
        assert(!bytes32List.contains('b'));
        assert(!bytes32List.contains('c'));
        assert(bytes32List.array.length == 0);

        // test 3: remove body first
        assert(bytes32List.add('a'));
        assert(bytes32List.add('b'));
        assert(bytes32List.add('c'));

        assert(bytes32List.remove('b'));
        assert(bytes32List.remove('c'));
        assert(bytes32List.remove('a'));

        assert(!bytes32List.contains('a'));
        assert(!bytes32List.contains('b'));
        assert(!bytes32List.contains('c'));
        assert(bytes32List.array.length == 0);
    }
    
    function testUintList () public {
        // test 1: remove head first
        assert(uintList.add(0));
        assert(uintList.add(1));
        assert(uintList.add(2));
        assert(uintList.array.length == 3);
        
        assert(uintList.array[0] == 0);
        assert(uintList.array[1] == 1);
        assert(uintList.array[2] == 2);
        
        assert(uintList.contains(0));
        assert(uintList.contains(1));
        assert(uintList.contains(2));

        assert(uintList.remove(0));
        assert(uintList.remove(1));
        assert(uintList.remove(2));

        assert(!uintList.contains(0));
        assert(!uintList.contains(1));
        assert(!uintList.contains(2));
        assert(uintList.array.length == 0);

        // test 2: remove tail first
        assert(uintList.add(0));
        assert(uintList.add(1));
        assert(uintList.add(2));

        assert(uintList.remove(2));
        assert(uintList.remove(1));
        assert(uintList.remove(0));

        assert(!uintList.contains(0));
        assert(!uintList.contains(1));
        assert(!uintList.contains(2));
        assert(uintList.array.length == 0);

        // test 3: remove body first
        assert(uintList.add(0));
        assert(uintList.add(1));
        assert(uintList.add(2));

        assert(uintList.remove(1));
        assert(uintList.remove(2));
        assert(uintList.remove(0));

        assert(!uintList.contains(0));
        assert(!uintList.contains(1));
        assert(!uintList.contains(2));
        assert(uintList.array.length == 0);
    }

}