// @ts-nocheck
import React from "react";
import Editor from "../components/editor";
import Sandbox from "@/components/sandbox";
import "./code.less";
import * as cmap3d from "@ali/cmap3d";

const {
  reactCmap3d: { Holomap },
} = cmap3d;

export default (props: any) => {
  return (
    <div className="pageContainer">
      <h1>预览Demo</h1>
      {/* <>
        <Holomap
          style={{
            height: "600px",
            width: "100%",
          }}
          map={{
            fov: 60,
            position: {
              lat: 30.68822,
              lng: 111.31895,
              altitude: 150,
            },
            rotation: { tilt: 90, pan: 0 },
          }}
          config={{
            env: {
              projectId: "1",
              baseUrl: "https://twin.aliyun.test/api/v1",
              tileUrl:
                "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
            },
            trip: {
              visible: true,
              showPlate: true,
              modelStyle: {
                car: {
                  url: [
                    "https://vaas-warehouse.oss-cn-shanghai.aliyuncs.com/twinfabric3D/Car/car01.gltf",
                    "https://vaas-warehouse.oss-cn-shanghai.aliyuncs.com/twinfabric3D/Car/car02.gltf",
                    "https://vaas-warehouse.oss-cn-shanghai.aliyuncs.com/twinfabric3D/Car/car03.gltf",
                  ],
                  scale: [1, 1, 1],
                },
              },
              defaultModelStyle: {
                url: "https://vaas-warehouse.oss-cn-shanghai.aliyuncs.com/twinfabric3D/Car/car01.gltf",
                scale: [1, 1, 1],
              },
              tripWS:
                "wss://dataq-cn-shanghai.aliyuncs.com/city_brain_tfc_test/trafficproduct/getInterVhcTraceDetailws?Date=Tue, 28 Jun 2022 09:48:36 GMT&Authorization=trafficproduct x87a8IZ3UgA36GdH",
              delay: 60000,
              frameInterval: 1000,
              follow: true,
            },
            light: {
              visible: true,
              phaseWS:
                "wss://dataq-cn-shanghai.aliyuncs.com/city_brain_tfc_test/trafficproduct/getInterPhaseStatusws?Date=Tue, 28 Jun 2022 09:48:36 GMT&Authorization=trafficproduct x87a8IZ3UgA36GdH",
              staticPhase:
                "https://dataq-cn-shanghai.aliyuncs.com/city_brain_tfc_test/trafficproduct/getPhaseLaneRltn?Date=Tue, 28 Jun 2022 09:48:36 GMT&Authorization=trafficproduct x87a8IZ3UgA36GdH",
              delay: 60000,
            },
          }}
        />
      </> */}
      <div className="container">
        {/* <div style={{ width: "50%", height: "100%" }}>
          <Editor width="100%" height="100%" />
        </div> */}
        <div style={{ width: "50%" }}>
          <Sandbox />
        </div>
      </div>
    </div>
  );
};
