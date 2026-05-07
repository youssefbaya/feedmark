import { useParams } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';

import AssignmentForm from '../components/AssignmentForm';
import PageTransition from '../components/PageTransition';

function CreateAssignment({ editMode = false }) {
  const { id } = useParams();
  const { getAssignment } = useAssignments();

  const assignment = editMode
    ? getAssignment(id)
    : null;

  return (
    <PageTransition>
      <div className="page">
        <h1>
          {editMode
            ? 'Edit Assignment'
            : 'Create New Assignment'}
        </h1>

        <p>
          {editMode
            ? 'Update the assignment structure and marking criteria.'
            : 'Build a marking scheme with sections and criteria.'}
        </p>

        <AssignmentForm
          editMode={editMode}
          existingAssignment={assignment}
        />
      </div>
    </PageTransition>
  );
}

export default CreateAssignment;