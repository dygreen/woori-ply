// 이름 형식 체크 (+ 닉네임)
export const nameRegExp = ($value: string) => {
    const regExp = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/

    return regExp.test($value)
}

// 비밀번호 형식 체크
export const pwdRegExp = ($value: string) => {
    const regExp = /^.*(?=^.{8,20}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/

    return regExp.test($value)
}

// 이메일 형식 체크
export const emailRegExp = ($value: string) => {
    const mailRegExp =
        /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i

    return mailRegExp.test($value)
}
