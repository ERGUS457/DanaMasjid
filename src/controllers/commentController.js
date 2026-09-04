import { CommentModel } from '../models/commentModel.js';

export const CommentController = {
  async addComment(req, res) {
    try {
      const { nama, komentar } = req.body;

      if (!komentar || !komentar.trim()) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong.' });
        }
        req.flash('error', 'Komentar tidak boleh kosong.');
        return res.redirect('/#komentar');
      }

      const newComment = await CommentModel.create({
        nama,
        komentar
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          message: 'Komentar berhasil dikirim.',
          comment: newComment
        });
      }

      req.flash('success', 'Terima kasih, komentar Anda berhasil dikirim!');
      return res.redirect('/#komentar');
    } catch (error) {
      console.error('Error saat menyimpan komentar:', error);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mengirim komentar.' });
      }
      req.flash('error', 'Gagal mengirim komentar. Silakan coba lagi.');
      return res.redirect('/#komentar');
    }
  }
};
