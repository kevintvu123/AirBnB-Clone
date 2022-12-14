'use strict';
const bcrypt = require('bcryptjs');
const {
  Model,
  Validator
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {

    toSafeObject() {
      const { id, firstName, lastName, username, email } = this; // context will be the User instance
      return { id, firstName, lastName, username, email }; //User instance info that is safe to save to JWT
    }

    validatePassword(password) { // return true if there is a match with the User instance's hashedPassword
      return bcrypt.compareSync(password, this.hashedPassword.toString());
    }

    static getCurrentUserById(id) {
      return User.scope("currentUser").findByPk(id);
    }

    static async login({ credential, password }) {
      const { Op } = require('sequelize');
      const user = await User.scope('loginUser').findOne({    //search for one User with the specified credential (either a username or an email)
        where: {
          [Op.or]: {
            username: credential,
            email: credential
          }
        }
      });
      if (user && user.validatePassword(password)) {    //
        return await User.scope('currentUser').findByPk(user.id);
      }
    }

    static async signup({ firstName, lastName, username, email, password }) {
      const hashedPassword = bcrypt.hashSync(password); //Hash the password
      const user = await User.create({
        username,
        email,
        hashedPassword,
        firstName,
        lastName
      });
      return await User.scope('currentUser').findByPk(user.id);
    }

    static associate(models) {
      // define association here
      User.hasMany(models.Spot, {
        foreignKey: 'ownerId'
      })

      User.hasMany(models.Booking, {
        foreignKey: 'userId'
      })

      User.hasMany(models.Review, {
        foreignKey: 'userId'
      })
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [4, 30],
        isNotEmail(value) {
          if (Validator.isEmail(value)) {
            throw new Error("Cannot be an email.")
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 256],
        isEmail: true
      }
    },
    hashedPassword: {
      type: DataTypes.STRING.BINARY,
      allowNull: false,
      validate: {
        len: [60, 60]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    defaultScope: {     //Model Scopes - Protecting Users' Info
      attributes: {
        exclude: ["hashedPassword", "email", "createdAt", "updatedAt"]
      }
    },
    scopes: {
      currentUser: {
        attributes: { exclude: ["hashedPassword", "createdAt", "updatedAt"] }
      },
      loginUser: {
        attributes: {}
      }
    }
  });
  return User;
};