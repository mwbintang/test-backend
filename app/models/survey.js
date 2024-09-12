'use strict';
const {
  Model, Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class survey extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  survey.init({
    userId: DataTypes.INTEGER,
    values: {
      type: Sequelize.ARRAY(Sequelize.INTEGER), // Sequelize equivalent of _int4
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'survey',
  });
  return survey;
};