import HeaderLayout from './headerLayout';
import Registration from '../pages/registration.jsx';

function RegistrationOnlyLayout() {
  return (
    <div className='layout'>
      <HeaderLayout />
      <main className='main'>
        <Registration />
      </main>
    </div>
  );
}

export default RegistrationOnlyLayout;
