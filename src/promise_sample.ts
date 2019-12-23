import { cancelableTimeoutPromise, resolveableTimeoutPromise } from "./utilities";

export async function myFunc(): Promise<true> {
    let continueLoop = true;
    while (continueLoop) {
        const [cancel, promise] = cancelableTimeoutPromise(2300);
        promise.then(function() {
            console.log('Loop got cancelled');
            continueLoop = false;
        }).catch(() => {console.log('Promise was rejected');});

        const randomTime = Math.floor(Math.random() * 2500);
        console.log("Random time", randomTime);
        const timerID = setTimeout(cancel, randomTime);

        try {
            await promise;
        } catch {
            console.log("Caught await promise");
        }
    }

    return true;
}

function receiveHeartbeat(): Promise<number> {
    const randomTime = Math.floor(Math.random() * 2500);

    return new Promise(function(resolve, reject) {

    });
}

export async function myFunc2(): Promise<true> {
    let continueLoop = true;
    while (continueLoop) {
        const [resolve, promise] = resolveableTimeoutPromise(2500);

        const randomTime = Math.floor(Math.random() * 3000);
        console.log("Random time", randomTime);
        const timerID = setTimeout(resolve, randomTime);

        try {
            await promise;
            console.log('Heart beat');
            clearTimeout(timerID);
        } catch {
            continueLoop = false;
            console.log('End Loop');
        }
    }

    return true;
}


myFunc2();
