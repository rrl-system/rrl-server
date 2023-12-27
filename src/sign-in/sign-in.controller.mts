import signUpService from './sign-in.service.mjs'

class SignInController {
  userSignIn(req, res, next) {
    signUpService.userSignIn(req)
      .then((token) => {
        res.status(200).send({ token })
      })
      .catch(next)
  }
}

const signInController: SignInController = new SignInController()

export default signInController