let value: string = "One";

for (let i = 0; i < 2; i++) {
    switch(value) {
        case "One":
            console.log("Case 1");
            value = "Two";
            break;
        case "Two":
            console.log("Case 2");
        case "Three":
            console.log("Case 3");
    }
}