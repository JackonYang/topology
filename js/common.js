// double link to make it a typical undirected graph
var doubleLinks = function (link) {
    "use strict";
    var links = [], i = 0, ll = 0;
    for (i = 0, ll = link.length; i < ll; i = i + 1) {
        links.push([link[i][1], link[i][0]]);
        links.push(link[i]);
    }
    return links;
};

var strToJson = function (str) {
    return (new Function("return " + str))();
};

/*
 * define father and son relationship according to links.
 * set father to be -1, if none father node connected to son.
 */
var father_son = function (upperLevel, lowerLevel, links) {
    "use strict";
    var res = {}, father = '', son = '',
        link2 = doubleLinks(links);
    for (var link in link2) {
        son = link2[link][0];
        father = link2[link][1];
        if ((upperLevel.indexOf(father) > -1) && (lowerLevel.indexOf(son) > -1)) {
            if (!res[father]) {
                res[father] = [son];
            } else if (res[father].indexOf(son) === -1) {
                res[father].push(son);
            }
        }
    }
    return res;
}

/*
 * sort facility in the same layer to avoid cross lines.
 * input: subOvs/subHost = {'father1':[son1, son2, ...], father2: [son1, son2, ...]}
 *        fatherSeq = node sequence of last layer
 * if there are both ovs and host under a ovs, put ovs in the middle surrounding with hosts
 * fatherSeq can not be empty for subOvs and subHost data structure needs it.
 */
var sort = function(subHost, subOvs, fatherSeq) {
    var seq = [],
        host,
        ovs,
        mid;
    fatherSeq.forEach(function (father) {
        host = subHost[father] || [];
        ovs = subOvs[father] || [];
        if (host && ovs){
            mid = Math.ceil(host.length* 0.5);
            seq = seq.concat(host.slice(0, mid))
            seq = seq.concat(ovs)
            seq = seq.concat(host.slice(mid))
        }
    });
    return unique(seq);
}
