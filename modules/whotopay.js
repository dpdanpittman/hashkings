export function whotopay() {
    return (
        function whotopay() {
            var a = {
                    a: [],
                    b: [],
                    c: [],
                    d: [],
                    e: [],
                    f: [],
                    g: [],
                    h: [],
                    i: [],
                    j: []
                }, // 10 arrays for bennies
                b = 0, // counter
                c = 0, // counter
                h = 1, // top value
                r = {j:0,i:0,h:0,g:0,f:0,e:0,d:0,c:0,b:0,a:0}
                o = [] // temp array
            for (d in state.kudos) {
                c = parseInt(c) + parseInt(state.kudos[d]) // total kudos
                if (state.kudos[d] > h) { // top kudos(for sorting)
                    h = state.kudos[d]
                };
                if (state.kudos[d] == 1) { // for sorting , unshift 1 assuming most will be 1
                    o.unshift({
                        account: d,
                        weight: 1
                    })
                } else {
                    if(!o.length){o.unshift({ //if nothing to sort, unshift into array
                        account: d,
                        weight: parseInt(state.kudos[d])
                    })}
                    for (var i = o.length - 1; i > 0; i--) { // insert sort
                            if (state.kudos[d] <= o[i].weight) {
                                o.splice(i, 0, {
                                    account: d,
                                    weight: parseInt(state.kudos[d])
                                });
                                break;
                            } else if (state.kudos[d] > o[o.length-1].weight) {
                                o.push({
                                    account: d,
                                    weight: parseInt(state.kudos[d])
                                });
                                break;
                            }
                    }
                }
            }
            if (o.length > (maxEx * 10)) {
                b = (maxEx * 10)
            } else {
                b = o.length
            }
            while (b) { // assign bennies to posts, top kudos down
                for (var fo in a) {
                    a[fo].push(o.pop());
                    b--
                    if(!b)break;
                }
                if(b){
                    for (var fr in r) {
                        a[fr].push(o.pop());
                        b--
                        if(!b)break;
                    }
                }
            }
            state.kudos = {} //put back bennies over the max extentions limit
                for (var i = 0; i < o.length; i++) {
                    state.kudos[o[i].account] = parseInt(o[i].weight)
                }
            for (var r in a) { //weight the 8 accounts in 10000
                var u = 0,
                    q = 0
                for (var i = 0; i < a[r].length; i++) {
                    u = parseInt(u) + parseInt(a[r][i].weight)
                }
                q = parseInt(10000/u)
                for (var i = 0; i < a[r].length; i++) {
                    a[r][i].weight = parseInt(parseInt(a[r][i].weight) * q)
                }
            }
            o = []
            for (var i in a){
                o.push(a[i])
            }
            console.log('payday:'+o)
            return o
        }
    );
}