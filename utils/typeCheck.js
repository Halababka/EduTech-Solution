const typeCheck = (value, expectedType) => {
    return typeof value === expectedType || (expectedType === 'Array' && Array.isArray(value));
};
export default typeCheck;