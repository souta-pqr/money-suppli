import basicCourse from './courses/basicCourse.js';
import investmentStrategyCourse from './courses/investmentStrategyCourse.js';
import riskManagementCourse from './courses/riskManagementCourse.js';

// 全コースのデータを配列として格納
const learningContent = [
  basicCourse,
  investmentStrategyCourse,
  riskManagementCourse
];

// コンポーネントで使用する courses をエクスポート
export const courses = learningContent;

// デフォルトエクスポートも維持
export default learningContent;