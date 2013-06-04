test('sort()', function () {
    "use strict";
    var hosts = {"f1": ['h11', 'h12'], 'f2': ['h21', 'h22', 'h23', 'h24', 'h25'], 'f3': ['h31', 'h32', 'h33']},
        ovss = {"f1": ['v11', 'v12'], 'f2': ['v21', 'v22', 'v23'], 'f3': ['v31', 'v32', 'v33']},
        f = ['f1', 'f2', 'f3'],
        res = ["h11", "v11", "v12", "h12", "h21", "h22", "h23", "v21", "v22", "v23", "h24", "h25", "h31", "h32", "v31", "v32", "v33", "h33"],
        res_ovs_empty = ["h11", "h12", "h21", "h22", "h23", "h24", "h25", "h31", "h32", "h33"],
        res_host_empty = ["v11", "v12", "v21", "v22", "v23", "v31", "v32", "v33"];
    deepEqual(sort(hosts, ovss, f), res, 'both ovs and host in the same layer');
    deepEqual(sort(hosts, {}, f), res_ovs_empty, 'no ovs, only host');
    deepEqual(sort({}, ovss, f), res_host_empty, 'no host, only ovs');
    deepEqual(sort({}, {}, []), [], 'return [] if father is empty');
    deepEqual(sort(hosts, hosts, f), res_ovs_empty, 'remove repeated items');
});

test('father_son()', function () {
    "use strict";
    var father = ['01', '02', '03'],
        son = ['04', '05', '06', '07', '08'],
        links = [['03', '01'], ['07', '01'], ['12', '11'], ['11', '01'], ['05', '03'], ['04', '01']],
        res = {'01': ['07', '04'], '03': ['05']};
        deepEqual(father_son(father, son, links), res, '确定交换机和下一层交换机、主机之间的父子关系');
});

test('bfs()', function () {
    //bfs();
    ok(true);
});


test('Display()', function () {
    "use strict";
    var coordiantesNodes = {'ovs': {'11': [100, 200]}, 'host': {'12': [150, 300]}, 'flowvisor': {'13': [100, 400]}},
        coordiantesEdges = {'edge': {'51': [100, 200, 150, 300], '52': [150, 300, 100, 400]}},
        testContent = new Display("div#test");
    testContent.add_vertexs(coordiantesNodes);
    testContent.add_edges('edge', coordiantesEdges.edge);
    testContent.show();
    ok(true);
});
