pragma solidity ^0.4.23;

/// @dev A library for a simple unordered list that stores unique uint values.
library LibList {

    /// @dev 'List' is an unordered list that holds uint value;
    struct Bytes32List {
        bytes32[] array; // An unordered list of unique values
        mapping (bytes32 => bool) exists; // Tracks if a value exists in the list
        mapping (bytes32 => uint) index; // Tracks the index location of a value
    }

    /// @notice Called when a bytes32 value is added to 'list'
    /// @param list The storage that holds the list
    /// @param value The value to add to 'list'
    /// @return True if the 'value' is added, false if it already exists in the list
    function add (Bytes32List storage list, bytes32 value) public returns (bool success) {
        // Only add 'value' if it does not exist in the list
        if(list.exists[value])
            return false;
        
        list.index[value] = list.array.length;
        list.exists[value] = true;
        list.array.push(value);
            
        return true;
    }
    
    /// @notice Called when a bytes32 value is removed from 'list'
    /// @param list The storage that holds the list
    /// @param value The value to remove from 'list'
    /// @return True if the 'value' is removed, false if the 'value' did not exists in the list
    function remove (Bytes32List storage list, bytes32 value) public returns (bool success) {
        // Only remove 'value' if it exists in the list
        if(!list.exists[value])
            return false;
    
        uint indexBeingRemoved = list.index[value]; // The index of 'value'
        bytes32 replacementValue = list.array[list.array.length-1]; // The last value in the list
        
        // Move the replacement value to the index of 'value'
        list.array[indexBeingRemoved] = replacementValue;
        list.index[replacementValue] = indexBeingRemoved;
        list.array.length--;
        
        // clean up 
        delete(list.exists[value]);
        delete(list.index[value]);
        
        return true;
    }
    
    /// @param list The storage that holds the list
    /// @return The length of the 'list'
    function getLength (Bytes32List storage list) public constant returns (uint) {
        return list.array.length;
    }
    
    function contains (Bytes32List storage list, bytes32 value) public view returns (bool) {
        return list.exists[value];
    }
    
    struct AddressList {
        address[] array; // An unordered list of unique values
        mapping (address => bool) exists; // Tracks if a value exists in the list
        mapping (address => uint) index; // Tracks the index location of a value
    }
    
    /// @notice Called when a address value is added to 'list'
    /// @param list The storage that holds the list
    /// @param value The value to add to 'list'
    /// @return True if the 'value' is added, false if it already exists in the list
    function add (AddressList storage list, address value) public returns (bool success) {
        // Only add 'value' if it does not exist in the list
        if(list.exists[value])
            return false;
        
        list.index[value] = list.array.length;
        list.exists[value] = true;
        list.array.push(value);
            
        return true;
    }
    
    /// @notice Called when a address value is removed from 'list'
    /// @param list The storage that holds the list
    /// @param value The value to remove from 'list'
    /// @return True if the 'value' is removed, false if the 'value' did not exists in the list
    function remove (AddressList storage list, address value) public returns (bool success) {
        // Only remove 'value' if it exists in the list
        if(!list.exists[value])
            return false;
    
        uint indexBeingRemoved = list.index[value]; // The index of 'value'
        address replacementValue = list.array[list.array.length-1]; // The last value in the list
        
        // Move the replacement value to the index of 'value'
        list.array[indexBeingRemoved] = replacementValue;
        list.index[replacementValue] = indexBeingRemoved;
        list.array.length--;
        
        // clean up 
        delete(list.exists[value]);
        delete(list.index[value]);
        
        return true;
    }
    
    /// @param list The storage that holds the list
    /// @return The length of the 'list'
    function getLength (AddressList storage list) public constant returns (uint) {
        return list.array.length;
    }
    
    function contains (AddressList storage list, address value) public view returns (bool) {
        return list.exists[value];
    }
    
    struct UintList {
        uint[] array; // An unordered list of unique values
        mapping (uint => bool) exists; // Tracks if a value exists in the list
        mapping (uint => uint) index; // Tracks the index location of a value
    }
    
    /// @notice Called when a uint is added to 'list'
    /// @param list The storage that holds the list
    /// @param value The value to add to 'list'
    /// @return True if the 'value' is added, false if it already exists in the list
    function add (UintList storage list, uint value) public returns (bool success) {
        // Only add 'value' if it does not exist in the list
        if(list.exists[value])
            return false;
        
        list.index[value] = list.array.length;
        list.exists[value] = true;
        list.array.push(value);
            
        return true;
    }
    
    /// @notice Called when a uint is removed from 'list'
    /// @param list The storage that holds the list
    /// @param value The value to remove from 'list'
    /// @return True if the 'value' is removed, false if the 'value' did not exists in the list
    function remove (UintList storage list, uint value) public returns (bool success) {
        // Only remove 'value' if it exists in the list
        if(!list.exists[value])
            return false;
    
        uint indexBeingRemoved = list.index[value]; // The index of 'value'
        uint replacementValue = list.array[list.array.length-1]; // The last value in the list
        
        // Move the replacement value to the index of 'value'
        list.array[indexBeingRemoved] = replacementValue;
        list.index[replacementValue] = indexBeingRemoved;
        list.array.length--;
        
        // clean up 
        delete(list.exists[value]);
        delete(list.index[value]);
        
        return true;
    }
    
    /// @param list The storage that holds the list
    /// @return The length of the list at 'list'
    function getLength (UintList storage list) public constant returns (uint) {
        return list.array.length;
    }
    
    function contains (UintList storage list, uint value) public view returns (bool) {
        return list.exists[value];
    }
    
}