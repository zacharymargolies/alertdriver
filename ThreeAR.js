import ExpoTHREE, { THREE } from 'expo-three';
import { Dimensions } from 'react-native';
import { AR } from 'expo';
const { width, height } = Dimensions.get('window');

type Point = {
  x: number,
  y: number,
};
type Vector = {
  x: number,
  y: number,
  z: number,
};

export class HitTestRay {
  origin: Vector;
  direction: Vector;
}

export class FeatureHitTestResult {
  position; //Vector3
  distanceToRayOrigin;
  featureHit; //Vector3
  featureDistanceToHitResult;
}

export const suppressWarnings = shouldSuppress => {
  if (shouldSuppress) {
    global.__expo_three_ar_oldWarn = global.__expo_three_ar_oldWarn || console.warn;
    global.console.warn = str => {
      let tst = (str || '') + '';
      if (
        tst.startsWith('THREE.Matrix4: .getInverse()') ||
        tst.startsWith('THREE.Matrix3: .getInverse()')
      ) {
        // don't provide stack traces for warnspew from THREE
        // console.log('Warning:', str);
        return;
      }
      return global.__expo_three_ar_oldWarn.apply(console, [str]);
    };
  } else {
    console.warn = global.__expo_three_ar_oldWarn;
  }
};

//-> [FeatureHitTestResult]
export function hitTestWithFeatures(
  camera,
  point: Point,
  coneOpeningAngleInDegrees: number,
  minDistance: number = 0,
  maxDistance: number = 99999999999999,
  maxResults: number = 1
) {
  let results = [];

  const { rawFeaturePoints } = AR.getCurrentFrame({ rawFeaturePoints: true });

  if (rawFeaturePoints.length === 0) {
    return results;
  }

  const ray = hitTestRayFromScreenPos(camera, point);
  if (!ray) {
    return results;
  }

  const maxAngleInDeg = Math.min(coneOpeningAngleInDegrees, 360) / 2;
  const maxAngle = maxAngleInDeg / 180 * Math.PI;

  for (let feature of rawFeaturePoints) {
    const { x, y, z } = feature;

    let featurePos = new THREE.Vector3(x, y, z);

    let originToFeature = featurePos.clone().sub(ray.origin);

    let crossProduct = originToFeature.clone().cross(ray.direction);
    let featureDistanceFromResult = crossProduct.length();

    const hitTestResult = ray.origin
      .clone()
      .add(ray.direction.clone().multiply(ray.direction.clone().dot(originToFeature)));

    const hitTestResultDistance = hitTestResult
      .clone()
      .sub(ray.origin)
      .length();

    if (hitTestResultDistance < minDistance || hitTestResultDistance > maxDistance) {
      // Skip this feature - it is too close or too far away.
      continue;
    }

    const originToFeatureNormalized = originToFeature.clone().normalize();
    const angleBetweenRayAndFeature = Math.acos(
      ray.direction.clone().dot(originToFeatureNormalized)
    );

    if (angleBetweenRayAndFeature > maxAngle) {
      // Skip this feature - is is outside of the hit test cone.
      continue;
    }

    // All tests passed: Add the hit against this feature to the results.
    let featureHitTestResult = new FeatureHitTestResult();
    featureHitTestResult.position = hitTestResult;
    featureHitTestResult.distanceToRayOrigin = hitTestResultDistance;
    featureHitTestResult.featureHit = featurePos;
    featureHitTestResult.featureDistanceToHitResult = featureDistanceFromResult;

    results.append(featureHitTestResult);
  }

  // Sort the results by feature distance to the ray.
  results = results.sort((first, second) => first.distanceToRayOrigin < second.distanceToRayOrigin);

  // Cap the list to maxResults.
  var cappedResults = [];
  let i = 0;
  while (i < maxResults && i < results.count) {
    cappedResults.push(results[i]);
    i += 1;
  }

  return cappedResults;
}

//-> [FeatureHitTestResult]
export function hitTestWithPoint(camera, point: Point) {
  var results = [];
  const ray = hitTestRayFromScreenPos(camera, point);
  if (!ray) {
    return results;
  }
  const result = hitTestFromOrigin(ray.origin, ray.direction);
  if (result != null) {
    results.push(result);
  }

  return results;
}

export function unprojectPoint(camera, obj) {
  let vector = obj.clone();
  const widthHalf = width / 2;
  const heightHalf = height / 2;

  vector.project(camera);

  vector.x = vector.x * widthHalf + widthHalf;
  vector.y = -(vector.y * heightHalf) + heightHalf;
  vector.z = 0;

  return vector;
}

export function hitTestRayFromScreenPos(camera, point: Point) {
  let cameraPos = positionFromTransform(camera.matrix);

  // Note: z: 1.0 will unproject() the screen position to the far clipping plane.
  let positionVec = new THREE.Vector3(point.x, point.y, 1.0);
  let screenPosOnFarClippingPlane = unprojectPoint(camera, positionVec);

  let rayDirection = screenPosOnFarClippingPlane.clone().sub(cameraPos);
  rayDirection.normalize();

  const hitTest = new HitTestRay();
  hitTest.origin = cameraPos;
  hitTest.direction = rayDirection;
  return hitTest;
}
//-> FeatureHitTestResult?
export function hitTestFromOrigin(origin: Vector, direction: Vector) {
  const { rawFeaturePoints } = AR.getCurrentFrame({ rawFeaturePoints: true });

  if (rawFeaturePoints.length === 0) {
    return [];
  }

  // Determine the point from the whole point cloud which is closest to the hit test ray.
  var closestFeaturePoint = origin;
  var minDistance = 99999999999;

  for (let feature of rawFeaturePoints) {
    const { x, y, z, id } = feature;
    let featurePos = new THREE.Vector3(x, y, z);

    let originVector = origin.clone().sub(featurePos);
    let crossProduct = originVector.clone().cross(direction);
    let featureDistanceFromResult = crossProduct.length();

    if (featureDistanceFromResult < minDistance) {
      closestFeaturePoint = featurePos;
      minDistance = featureDistanceFromResult;
    }
  }

  // Compute the point along the ray that is closest to the selected feature.
  let originToFeature = closestFeaturePoint.clone().sub(origin);
  let hitTestResult = origin
    .clone()
    .add(direction.clone().multiply(direction.clone().dot(originToFeature)));
  let hitTestResultDistance = hitTestResult
    .clone()
    .sub(origin)
    .length();

  let featureHitTestResult = new FeatureHitTestResult();

  featureHitTestResult.position = hitTestResult;
  featureHitTestResult.distanceToRayOrigin = hitTestResultDistance;
  featureHitTestResult.featureHit = closestFeaturePoint;
  featureHitTestResult.featureDistanceToHitResult = minDistance;
  return featureHitTestResult;
}

export function hitTestWithInfiniteHorizontalPlane(camera, point: Point, pointOnPlane: Vector) {
  const ray = hitTestRayFromScreenPos(camera, point);
  if (!ray) {
    return null;
  }

  // Do not intersect with planes above the camera or if the ray is almost parallel to the plane.
  if (ray.direction.y > -0.03) {
    return null;
  }

  // Return the intersection of a ray from the camera through the screen position with a horizontal plane
  // at height (Y axis).
  return rayIntersectionWithHorizontalPlane(ray.origin, ray.direction, pointOnPlane.y);
}

export function rayIntersectionWithHorizontalPlane(
  rayOrigin: Vector,
  direction: Vector,
  planeY: Float
) {
  direction = direction.normalize();

  // Special case handling: Check if the ray is horizontal as well.
  if (direction.y == 0) {
    if (rayOrigin.y == planeY) {
      // The ray is horizontal and on the plane, thus all points on the ray intersect with the plane.
      // Therefore we simply return the ray origin.
      return rayOrigin;
    } else {
      // The ray is parallel to the plane and never intersects.
      return null;
    }
  }

  // The distance from the ray's origin to the intersection point on the plane is:
  //   (pointOnPlane - rayOrigin) dot planeNormal
  //  --------------------------------------------
  //          direction dot planeNormal

  // Since we know that horizontal planes have normal (0, 1, 0), we can simplify this to:
  let dist = (planeY - rayOrigin.y) / direction.y;

  // Do not return intersections behind the ray's origin.
  if (dist < 0) {
    return null;
  }

  // Return the intersection point.
  return rayOrigin + direction * dist;
}

export function convertTransformArray(transform) {
  const matrix = new THREE.Matrix4();
  matrix.fromArray(transform);
  return matrix;
}

export function positionFromTransform(transform) {
  const position = new THREE.Vector3();
  position.setFromMatrixPosition(transform);
  return position;
}

//-> (position: SCNVector3?, planeAnchor: ARPlaneAnchor?, hitAPlane: Bool)
// Code from Apple PlacingObjects demo: https://developer.apple.com/sample-code/wwdc/2017/PlacingObjects.zip
export function worldPositionFromScreenPosition(
  camera,
  position: Point,
  objectPos: Vector,
  infinitePlane = false,
  dragOnInfinitePlanesEnabled = false
) {
  // -------------------------------------------------------------------------------
  // 1. Always do a hit test against exisiting plane anchors first.
  //    (If any such anchors exist & only within their extents.)

  const { hitTest } = AR.performHitTest(
    {
      x: position.x / width,
      y: position.y / height,
    },
    AR.HitTestResultTypes.ExistingPlaneUsingExtent
  );

  if (hitTest.length > 0) {
    let result = hitTest[0];

    const { worldTransform, anchor } = result;
    const transform = convertTransformArray(worldTransform);
    const worldPosition = positionFromTransform(transform);
    // Return immediately - this is the best possible outcome.
    return {
      worldPosition,
      planeAnchor: anchor,
      hitAPlane: true,
    };
  }

  // -------------------------------------------------------------------------------
  // 2. Collect more information about the environment by hit testing against
  //    the feature point cloud, but do not return the result yet.
  let featureHitTestPosition = new THREE.Vector3();
  let highQualityFeatureHitTestResult = false;

  const highQualityfeatureHitTestResults = hitTestWithFeatures(camera, position, 18, 0.2, 2.0);

  if (highQualityfeatureHitTestResults.length > 0) {
    const result = highQualityfeatureHitTestResults[0];
    featureHitTestPosition = result.position;
    highQualityFeatureHitTestResult = true;
  }

  // -------------------------------------------------------------------------------
  // 3. If desired or necessary (no good feature hit test result): Hit test
  //    against an infinite, horizontal plane (ignoring the real world).
  if ((infinitePlane && dragOnInfinitePlanesEnabled) || !highQualityFeatureHitTestResult) {
    let pointOnPlane = objectPos || new THREE.Vector3();

    let pointOnInfinitePlane = hitTestWithInfiniteHorizontalPlane(camera, position, pointOnPlane);
    if (pointOnInfinitePlane) {
      return { worldPosition: pointOnInfinitePlane, hitAPlane: true };
    }
  }

  // -------------------------------------------------------------------------------
  // 4. If available, return the result of the hit test against high quality
  //    features if the hit tests against infinite planes were skipped or no
  //    infinite plane was hit.
  if (highQualityFeatureHitTestResult) {
    return { worldPosition: featureHitTestPosition, hitAPlane: false };
  }

  // -------------------------------------------------------------------------------
  // 5. As a last resort, perform a second, unfiltered hit test against features.
  //    If there are no features in the scene, the result returned here will be nil.

  let unfilteredFeatureHitTestResults = hitTestWithPoint(camera, position);
  if (unfilteredFeatureHitTestResults.length > 0) {
    let result = unfilteredFeatureHitTestResults[0];
    return { worldPosition: result.position, hitAPlane: false };
  }

  return { worldPosition: null, planeAnchor: null, hitAPlane: null };
}

export function createARCamera(width, height, near, far) {
  const camera = new THREE.PerspectiveCamera();

  camera.width = width;
  camera.height = height;
  camera.aspect = height > 0 ? width / height : 0;
  camera.near = near;
  camera.far = far;

  camera.updateMatrixWorld = () => {
    if (width > 0 && height > 0) {
      const matrices = AR.getARMatrices(camera.near, camera.far);
      if (matrices && matrices.viewMatrix) {
        camera.matrixWorldInverse.fromArray(matrices.viewMatrix);
        camera.matrixWorld.getInverse(camera.matrixWorldInverse);
        camera.projectionMatrix.fromArray(matrices.projectionMatrix);
      }
    }
  };

  camera.updateProjectionMatrix = () => {
    camera.updateMatrixWorld();
  };

  return camera;
}

export const scaleLongestSideToSize = (mesh, size) => {
  let sizedVector = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(sizedVector);

  const { x: width, y: height, z: depth } = sizedVector;

  const longest = Math.max(width, Math.max(height, depth));
  const scale = size / longest;
  mesh.scale.set(scale, scale, scale);
};

export function createARBackgroundTexture(renderer) {
  const texture = new THREE.Texture();
  const properties = renderer.properties.get(texture);
  properties.__webglInit = true;
  properties.__webglTexture = new WebGLTexture(AR.getCameraTexture());
  return texture;
}

export function positionFromAnchor({ worldTransform }) {
  const transform = convertTransformArray(worldTransform);
  const position = positionFromTransform(transform);
  return position;
}

export function improviseHitTest(point, camera) {
  const { hitTest } = AR.performHitTest(point, AR.HitTestResultTypes.HorizontalPlane);

  if (hitTest.length > 0) {
    const result = hitTest[0];
    return positionFromTransform(convertTransformArray(result.worldTransform));
  } else {
    // Create a transform with a translation of 0.1 meters (10 cm) in front of the camera
    const dist = 0.1;
    const translation = new THREE.Vector3(0, 0, -dist);
    translation.applyQuaternion(camera.quaternion);
    return translation;
  }
}
