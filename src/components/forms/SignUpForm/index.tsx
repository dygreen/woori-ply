'use client'

import { Form, Formik } from 'formik'
import { SignupSchema } from '@/lib/validation/auth'
import { TextField, Container, Button } from '@mui/material'
import { Box } from '@mui/system'
import Link from 'next/link'

export default function SignUpForm() {
    return (
        <Container
            maxWidth="md"
            fixed
            className="w-full h-screen flex flex-col items-center justify-center text-center"
        >
            <h1 className="text-4xl font-bold mb-8">회원가입</h1>
            <Formik
                initialValues={{
                    name: '',
                    email: '',
                    password: '',
                }}
                validationSchema={SignupSchema}
                onSubmit={(values) => {
                    console.log(values)
                }}
            >
                {({ values, handleChange, handleBlur, touched, errors }) => (
                    <Form noValidate className="w-full max-w-xs px-4">
                        <Box display="grid" gap={2}>
                            <TextField
                                name="name"
                                label="이름"
                                value={values.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.name && Boolean(errors.name)}
                                helperText={touched.name && errors.name}
                                autoComplete="name"
                                fullWidth
                                size="small"
                            />
                            <TextField
                                name="email"
                                label="이메일"
                                type="email"
                                value={values.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.email && Boolean(errors.email)}
                                helperText={touched.email && errors.email}
                                autoComplete="email"
                                fullWidth
                                size="small"
                            />
                            <TextField
                                name="password"
                                label="비밀번호"
                                type="password"
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={
                                    touched.password && Boolean(errors.password)
                                }
                                helperText={touched.password && errors.password}
                                autoComplete="password"
                                fullWidth
                                size="small"
                            />
                        </Box>
                        <div className="flex justify-between mt-8">
                            <Link href={'/'}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    type="submit"
                                >
                                    취소
                                </Button>
                            </Link>
                            <Button
                                variant="contained"
                                size="small"
                                type="submit"
                            >
                                가입하기
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Container>
    )
}
