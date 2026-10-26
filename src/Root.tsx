/**
 * Composition registry. One <Composition> per template x aspect; the
 * calibration composition is the only one that exists before the first
 * template (docs/research/00-environment-design.md section 10).
 */
import { Composition, Folder } from "remotion";
import { canvas } from "./brand/tokens";
import { SafeZoneCalibration, calibrationSchema } from "./calibration/SafeZoneCalibration";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Calibration">
        <Composition
          id="SafeZoneCalibration"
          component={SafeZoneCalibration}
          schema={calibrationSchema}
          defaultProps={{ zone: "union" }}
          width={canvas.width}
          height={canvas.height}
          fps={canvas.fps}
          durationInFrames={canvas.fps * 8}
        />
      </Folder>
    </>
  );
};
