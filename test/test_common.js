test('getConnected()', function() {
    var line = [[2, 1], [3, 1], [5, 1]];
    var small = [1, 3, 9], big = [1, 2, 3, 4, 9];
    
    deepEqual(getConnected(small, line, big),
        [5], '多父节点，选未搜索过的子节点')
    deepEqual(getConnected([1], line, small), [2, 5], '单父节点返回子节点')
    deepEqual(getConnected([], line, big), [], '无父节点返回空')
});

// 不支持数组
test('unique()', function() {
    var num = [11, 1, 2, 33, 33, 2], resNum = [11, 1, 2, 33];
    var sss = ['11', '1', '2', '33', '33', '2'], resSss = ['11', '1', '2', '33'];
    var multi = ['11', '1', 2, '33', '33', 2], resMulti = ['11', '1', 2, '33'];
    var mulEq = ['11', '1', '2', '33', '33', 2], resMulEq = ['11', '1', '2', '33', 2];
    
    deepEqual(unique(num), resNum, '纯数字,去除重复')
    deepEqual(unique(sss), resSss, '纯字符,去除重复')
    deepEqual(unique(multi), resMulti, '数字和字符,去除重复')
    deepEqual(unique(mulEq), resMulEq, '相同的字符和数字，暂不剔除')
});

test('getDegrees()', function() {
    edges = [[1, 2], [1, 3], [4, 5], [1, 5]];
    res = {1: 3, 2: 1, 3: 1, 4: 1, 5: 2};
    deepEqual(getDegrees(edges), res, 'get degree')

});
