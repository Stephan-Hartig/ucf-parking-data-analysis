# ucf-parking-data-analysis
Normalize the data from the raw data server and periodically run data analysis.

## Building
To compile the typescript run
```
npx tsc --project ./
```
and then run it with node.

## Running
As-is you'll need to externally schedule running the program hourly, but in the future I'll probably handle scheduling from within the code.
