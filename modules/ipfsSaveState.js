export function kudo() {
    
    return (
        function ipfsSaveState(blocknum, hashable) {
            ipfs.add(Buffer.from(JSON.stringify([blocknum, hashable]), 'ascii'), (err, IpFsHash) => {
                if (!err) {
                    if (IpFsHash[0].hash === undefined){
                       ipfsSaveState(blocknum, hashable) 
                    } else {
                        state.stats.bu = IpFsHash[0].hash
                        state.stats.bi = blocknum
                        console.log(blocknum + `:Saved:  ${IpFsHash[0].hash}`)
                        state.refund.push(['customJson', 'report', {
                            stateHash: state.stats.bu,
                            block: blocknum
                        }])
                    }
                } else {
                    console.log('IPFS Error', err)
                }
            })
        }
    );
}