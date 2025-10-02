exports.shorthands = {
  text: 'TEXT',
};

exports.up = (pgm) => {
  pgm.addColumn('student_profiles', {
    rekognition_face_id: { type: 'text', notNull: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('student_profiles', 'rekognition_face_id');
};


