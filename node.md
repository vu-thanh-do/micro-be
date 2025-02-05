mongod --port 27017 --dbpath "C:\data\db" --replSet rs0 --bind_ip localhost
mongod --port 27018 --dbpath "C:\data\db1" --replSet rs0 --bind_ip localhost
mongod --port 27019 --dbpath "C:\data\db2" --replSet rs0 --bind_ip localhost

cfg = rs.conf();
cfg.members[0].priority = 2;  // Ưu tiên cao nhất cho node 27017
cfg.members[1].priority = 1;  // Mức trung bình
cfg.members[2].priority = 0.5; // Ưu tiên thấp nhất
rs.reconfig(cfg, { force: true });





import React, { useState } from 'react'
import { Form, Input, Select, Button } from 'antd'

const { Option } = Select

const App = () => {
  // Fake API data
  const apiData = {
    _id: 'form_001',
    name: {
      en: 'Employee Information Form',
      vi: 'Form thông tin nhân viên',
      jp: '従業員情報フォーム'
    },
    fields: [
      {
        key: 'name',
        type: 'string',
        label: {
          en: 'Full Name',
          vi: 'Họ và tên',
          jp: '氏名'
        },
        required: true
      },
      {
        key: 'age',
        type: 'number',
        label: {
          en: 'Age',
          vi: 'Tuổi',
          jp: '年齢'
        },
        required: false
      },
      {
        key: 'address',
        type: 'object',
        fields: [
          {
            key: 'city',
            type: 'string',
            label: {
              en: 'City',
              vi: 'Thành phố',
              jp: '市'
            },
            required: true
          },
          {
            key: 'zipcode',
            type: 'string',
            label: {
              en: 'Zip Code',
              vi: 'Mã bưu điện',
              jp: '郵便番号'
            },
            required: false
          }
        ]
      }
    ]
  }

  // State for language selection
  const [language, setLanguage] = useState('en')

  // Render form fields
  const renderFields = (fields) => {
    return fields.map((field) => {
      if (field.type === 'object' && field.fields) {
        return (
          <div key={field.key} style={{ marginBottom: 20 }}>
            <h3>{field.label?.[language]}</h3>
            {renderFields(field.fields)}
          </div>
        )
      }

      switch (field.type) {
        case 'string':
          return (
            <Form.Item
              key={field.key}
              label={field.label?.[language] || field.key}
              name={field.key}
              rules={
                field.required
                  ? [{ required: true, message: `${field.label?.[language] || field.key} is required` }]
                  : []
              }
            >
              <Input />
            </Form.Item>
          )
        case 'number':
          return (
            <Form.Item
              key={field.key}
              label={field.label?.[language] || field.key}
              name={field.key}
              rules={
                field.required
                  ? [{ required: true, message: `${field.label?.[language] || field.key} is required` }]
                  : []
              }
            >
              <Input type='number' />
            </Form.Item>
          )
        default:
          return null
      }
    })
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{apiData.name?.[language] || 'Form'}</h1>

      <Select value={language} onChange={(value) => setLanguage(value)} style={{ width: 150, marginBottom: 20 }}>
        <Option value='en'>English</Option>
        <Option value='vi'>Tiếng Việt</Option>
        <Option value='jp'>日本語</Option>
      </Select>

      <Form layout='vertical'>
        {renderFields(apiData.fields)}
        <Form.Item>
          <Button type='primary' htmlType='submit'>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default App
