// below code is under worker environment
// to import tfjs into worker from a cdn
importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js"
);
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd");
// create 2 tensors and add them up
const a = tf.ones([2, 2]);
const b = tf.ones([2, 2]);
c = a.add(b);

let model;
// Load our model from the web
cocoSsd
  .load({
    base: "lite_mobilenet_v2",
  })
  .then((model) => {
    model = model;
    self.postMessage({
      data: {
        modelExists: model !== undefined,
      },
      status: "loaded",
    });

    self.onmessage = async function (e) {
      if (!model)
        return self.postMessage({
          data: { modelExists: model !== undefined },
          status: "log",
        });
      if (e.data.status === "predict") {
        const predictions = await model.detect(e.data.data);
        self.postMessage({ data: predictions, status: "predicted" });
      }
    };
  });
