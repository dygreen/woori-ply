import * as Yup from 'yup'
import * as VALIDATION from '@/lib/validation/patterns'

export const SignupSchema = Yup.object().shape({
    name: Yup.string()
        .required('이름을 입력해주세요.')
        .min(1, '이름을 1자 이상 입력해주세요.')
        .max(10, '이름을 10자 이하로 입력해주세요.')
        .test(
            'nameValid',
            '이름 형식이 올바르지 않습니다.',
            VALIDATION.nameRegExp,
        ),
    email: Yup.string()
        .required('이메일을 입력해주세요.')
        .test(
            'emailValid',
            '이메일 형식이 올바르지 않습니다.',
            VALIDATION.emailRegExp,
        ),
    password: Yup.string()
        .required('비밀번호를 입력해주세요.')
        .min(8, '비밀번호를 8자 이상 입력해주세요.')
        .max(20, '비밀번호를 20자 이하로 입력해주세요.')
        .test(
            'pwdValid',
            '비밀번호는 8~20자리여야 하며, 숫자, 문자, 특수문자를 포함해야 합니다.',
            VALIDATION.pwdRegExp,
        ),
})

export type SignUpInput = Yup.InferType<typeof SignupSchema>
