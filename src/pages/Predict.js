import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import queryString from "query-string";
import ArrowBack from "@material-ui/icons/ArrowBack";
import { Box, Link, Button } from "@material-ui/core";

import Main from "../layouts/Main";
import { fetchProjectScreensGroupedBySection } from "../services/zeplin";
import Loader from "../components/Loader";
import Detection from "../components/Detection";
import * as tf from "@tensorflow/tfjs";
tf.setBackend("webgl");

export default function Predict(props) {
  const [model, setModel] = useState(null);
  const [imgData, setImgData] = useState([]);
  const [round, setRound] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [totalLength, setTotalLength] = useState(null);
  const [classesDir, setClassesDir] = useState(null);

  const history = useHistory();
  const query = queryString.parse(history.location.search);

  const onBack = (e) => {
    e.preventDefault();
    history.replace("/create");
  };

  const savedModelShow = {
    RICO: {
      boxes: "3",
      scores: "2",
      classes: "1",
    },
    MOBBIN: {
      boxes: "1",
      scores: "4",
      classes: "2",
    },
  };

  const loadModel = async () => {
    const loadedModel = await tf.loadGraphModel(
      "/models/" + query.model + "/model.json"
    );
    const classesDir = require("../../public/models/" +
      query.model +
      "/label_map.json");

    setClassesDir(classesDir);
    setModel(loadedModel);
  };

  const onFetch = async () => {
    const sections = await fetchProjectScreensGroupedBySection(query.pid);
    let data = [];
    sections.map((section, index) => {
      section.screens.map((screen, index) => {
        const origin_img = screen.image.original_url;
        const imgProxy = origin_img.replace(
          "https://public-cdn.zeplin.dev/",
          "/"
        );

        const img = {
          pid: query.pid,
          screenId: screen.id,
          imageUrl: imgProxy,
          imgWidth: screen.image.width,
          imgHeight: screen.image.height,
        };
        data.push(img);
      });
    });

    console.log(data);
    setImgData(data);
    setRound(0);
    setTotalLength(data.length);
    setSelectedData(imgData[0]);
  };

  const onIncrease = () => {
    setRound(round + 1);
    setSelectedData(imgData[round]);
  };

  useEffect(() => {
    loadModel();
    onFetch();
  }, []);

  return (
    <Main>
      {model === null && <Loader text="Loading the model" />}
      {model !== null && selectedData !== null && (
        <>
          <Box marginBottom={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={onIncrease}
              fullWidth
            >
              {round} / {totalLength}
            </Button>
          </Box>
          <div>
            <Detection
              data={selectedData}
              model={model}
              classesDir={classesDir}
              savedModelShow={savedModelShow[query.model]}
            />
          </div>
        </>
      )}

      <Box position="absolute" left={16} top={16}>
        <Link
          style={{ fontSize: 16, display: "flex", alignItems: "center" }}
          component="button"
          onClick={onBack}
        >
          <ArrowBack color="primary" />
          Change a model and project
        </Link>
      </Box>
    </Main>
  );
}
