export const fileControllers = {
  uploadFile: async (req, res) => {
    try {
      const { tagert } = req.body;
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};
