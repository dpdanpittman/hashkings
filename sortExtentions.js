export function sortExtentions() {
    return (
        function sortExtentions(a, key) {
            var b=[],c=[]
            for(i=0;i<a.length;i++){
                b.push(a[i][key])
            }
            b = b.sort()
            while (c.length < a.length){
              for(i=0;i<a.length;i++){
                if(a[i][key] == b[0]){
                    c.push(a[i])
                    b.shift()
                }
              }
            }
            return c
        }
    );
}

