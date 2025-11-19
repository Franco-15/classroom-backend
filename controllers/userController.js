const prisma = require('../utils/prisma');

// PUT /api/users/profile - Actualizar perfil del usuario autenticado
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        ...user,
        createdAt: user.createdAt.toISOString()
      },
      message: 'Perfil actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar perfil.'
    });
  }
};

// DEPRECATED - Mantenido por compatibilidad
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;

    let filter = { isActive: true };
    if (role) {
      filter.role = role;
    }

    // Los estudiantes solo pueden verse a sí mismos
    if (req.user.role === 'student') {
      filter._id = req.user._id;
    }

    // Los profesores pueden ver estudiantes y otros profesores
    if (req.user.role === 'teacher') {
      filter.role = { $in: ['student', 'teacher'] };
    }

    // Los directores pueden ver todos los usuarios
    const users = await User.find(filter).select('-password');

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios',
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar permisos
    if (req.user.role === 'student' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este usuario'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuario',
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Los estudiantes solo pueden actualizar su propio perfil
    if (req.user.role === 'student' && id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes actualizar tu propio perfil'
      });
    }

    // Eliminar campos que no se pueden actualizar
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando usuario',
      error: error.message
    });
  }
};

const deactivateUser = async (req, res) => {
  try {
    // Solo directores pueden desactivar usuarios
    if (req.user.role !== 'director') {
      return res.status(403).json({
        success: false,
        message: 'Solo los directores pueden desactivar usuarios'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente',
      user
    });

  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error desactivando usuario',
      error: error.message
    });
  }
};

// module.exports = {
//   getUsers,
//   getUserById,
//   updateUser,
//   deactivateUser
// };