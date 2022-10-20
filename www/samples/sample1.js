/**
 * Created by andrewz on 11/15/2017.
 */
function sample1Main() {
  Aux.Visualization.initialize();
  Aux.Visualization.start([], onCompleted);
}

function onCompleted() {
  console.log("Completed!");
}
