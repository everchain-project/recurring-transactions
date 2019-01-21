pragma solidity ^0.5.0;

/// @dev A library for a simple unordered list that stores unique values.
library AddressListLib {
    
    struct AddressList {
        address[] array; // An unordered list of unique values
        mapping (address => bool) exists; // Tracks if a value exists in the list
        mapping (address => uint) getIndex; // Tracks the index location of a value
    }
    
    /// @notice Called when a address value is added to 'list'
    /// @param list The storage that holds the list
    /// @param value The value to add to 'list'
    /// @return True if the 'value' is added, false if it already exists in the list
    function add (AddressList storage list, address value) public returns (bool success) {
        // Only add 'value' if it does not exist in the list
        if(list.exists[value])
            return false;
        
        list.getIndex[value] = list.array.length;
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
    
        uint indexBeingRemoved = list.getIndex[value]; // The index of 'value'
        address replacementValue = list.array[list.array.length-1]; // The last value in the list
        
        // Move the replacement value to the index of 'value'
        list.array[indexBeingRemoved] = replacementValue;
        list.getIndex[replacementValue] = indexBeingRemoved;
        list.array.length--;
        
        // clean up 
        delete(list.exists[value]);
        delete(list.getIndex[value]);
        
        return true;
    }
    
    /// @notice Fetches the length of the list
    /// @param list The storage that holds the list
    /// @return The length of the 'list'
    function getLength (AddressList storage list) public view returns (uint) {
        return list.array.length;
    }
    
    /// @notice Fetches the length of the list
    /// @param list The storage that holds the list
    /// @param value The value to search for
    /// @return True if the value exists in the list
    function contains (AddressList storage list, address value) public view returns (bool) {
        return list.exists[value];
    }

    /// @notice Fetches the address of a given index
    /// @param list The storage that holds the list
    /// @param i The index to fetch
    /// @return The address at index 'i'
    function index (AddressList storage list, uint i) public view returns (address) {
        return list.array[i];
    }

    /// @notice Fetches the index of a given address
    /// @param list The storage that holds the list
    /// @param value The address to fetch the index of
    /// @return The index of 'value'
    function indexOf (AddressList storage list, address value) public view returns (uint) {
        return list.getIndex[value];
    }

    /// @notice Fetches the list of addresses
    /// @param list The storage that holds the list
    /// @return The list of addresses
    function get (AddressList storage list) public view returns (address[] memory) {
        return list.array;
    }
    
}