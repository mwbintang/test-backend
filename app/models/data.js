'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class data extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  data.init({
    sourceCountry: DataTypes.STRING,
    destinationCountry: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'data',
  });
  return data;
};