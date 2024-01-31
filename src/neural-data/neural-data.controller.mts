import neuralDataService from './neural-data.service.mjs'

class NeuralDataController {
  getNeuralData(req, res, next) {
    neuralDataService.getNeuralData(req)
      .then( result => {
        res.status(200).send({data: result})
      })
      .catch(next)
  }
}

const neuralDataController: NeuralDataController = new NeuralDataController()

export default neuralDataController