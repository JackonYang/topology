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

test('show', function () {
    "use strict";
    // @param vertex: {vertexType:{vertexId: [x, y]}}
    var data_vertex = {
        // single type
        'singleType-1node': { 
            'flowvisor': {
                'f001': [100, 100],
            }
        },
        'singleType-2node': {
            'ovs': {
                'v001': [100, 200],
                'v002': [200, 200]
            }
        },
        'singleType-3node': {
            'host': {
                'h001': [100, 300],
                'h002': [200, 300],
                'h003': [300, 300]
            }
        },
        // multitype
        'twoType-1nodeOfEach': {
            'ovs': {
                'v001': [100, 200],
            },
            'flowvisor': {
                'f001': [100, 100],
            }
        },
        'twoType-2nodeOfEach': {
            'host': {
                'h001': [100, 300],
                'h002': [200, 300]
            },
            'ovs': {
                'v001': [100, 200],
                'v002': [200, 200]
            }
        },
        'twoType-anyNode': {
            'host': {
                'h001': [100, 300]
            },
            'ovs': {
                'v001': [100, 200],
                'v002': [200, 200]
            }
        }
    },
        desc;
    for (desc in data_vertex) {
        if (data_vertex.hasOwnProperty(desc)) {
            $('body').append('<div class="HTMLgenerater">' + show(data_vertex[desc]) + '<p>' + desc + '</p>' + '</div>');
        }
    }

    ok(true);

});
