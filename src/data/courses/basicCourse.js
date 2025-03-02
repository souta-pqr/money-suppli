import lesson101 from '../lessons/basicCourse/lesson101.js';
import lesson102 from '../lessons/basicCourse/lesson102.js';
import lesson103 from '../lessons/basicCourse/lesson103.js';
import lesson104 from '../lessons/basicCourse/lesson104.js';
import lesson105 from '../lessons/basicCourse/lesson105.js';
import lesson106 from '../lessons/basicCourse/lesson106.js';
import lesson107 from '../lessons/basicCourse/lesson107.js';

export default {
  id: 1,
  title: '基礎知識コース',
  description: '金融の基礎となる概念や用語について学びます。お金の流れや投資の基本を理解し、健全な資産形成の第一歩を踏み出しましょう。',
  image: 'basics.jpg',
  lessonsCount: 7, // レッスン数
  lessons: [
    lesson101,
    lesson102,
    lesson103,
    lesson104,
    lesson105,
    lesson106,
    lesson107
  ]
};