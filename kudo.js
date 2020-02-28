export function kudo() {
    return (
        function kudos(user) {
            console.log('Kudos: ' + user)
            if (!state.kudos[user]) {
                state.kudos[user] = 1
            } else {
                state.kudos[user]++
            }
        }
    );
}