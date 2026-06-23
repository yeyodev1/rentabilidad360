import APIBase from './httpBase'

class UploadService extends APIBase {
  async uploadImage(file: File, folder: string = 'equipos') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    return this.post('upload', formData, {})
  }

  async deleteImage(publicId: string) {
    return this.delete('upload', { data: { publicId } } as any)
  }
}

export const uploadService = new UploadService()
